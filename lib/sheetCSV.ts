import type {Expense,Driver} from '../types';
import {parseCSV,parseMoney} from './csv';
import {emptySaleSheet,saleTotals} from './saleSheet';
import {validDate} from './finance';
const base=['Data','Venda nº','Firma','Dia da semana','Cidade','Estado','Prazo pag.','Roça','Nº NF','Valor da NF'];
const tail=['Valor total a pagar','Motorista','Placa','Cidade do motorista','Estado do motorista','Valor do frete por cx','Valor do seguro','Valor total do frete','Obs.'];
const num=(value:number)=>String(value).replace('.',',');
function previousSheetCSVRows(expenses:Expense[],drivers:Driver[]):unknown[][] {
 const header=[...base,'Total de cx',...tail];
 return [header,...expenses.map(e=>{const s=e.saleSheet||emptySaleSheet();const t=saleTotals(s);return [e.date,s.saleNumber,s.company,new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long'}),s.city,s.state,s.paymentTerms,s.farm,e.invoice,num(s.invoiceValue),num(t.boxes),num(t.payable),drivers.find(d=>d.id===e.driverId)?.name||'',e.licensePlate,s.driverCity,s.driverState,num(s.freightPerBox),num(e.seguro),num(e.freightValue),s.notes];})];
}
function importPreviousSheetCSV(text:string,drivers:Driver[],type:'internal'|'external'):Omit<Expense,'id'>[] {
 const rows=parseCSV(text.replace(/^\uFEFF/,''));
 if(!rows[0]?.includes('Total de cx') || rows[0].some(name=>/^Desconto [0-9]+$/.test(name)))return importLegacySheetCSV(text,drivers,type);
 const header=rows[0];const expected=[...base,'Total de cx',...tail];
 if(header.length!==expected.length || expected.some(name=>!header.includes(name)) || new Set(header).size!==header.length)throw new Error('Use o modelo CSV atual.');
 const converted=[...base,'Total de cx','Valor total','Quant. desconto 1','Desconto 1','Valor unitário desconto 1','Valor total desconto 1',...tail];
 const data=rows.slice(1).map((row,index)=>{if(row.length!==header.length)throw new Error(`Linha ${index+2}: quantidade de colunas inválida.`);const values=Object.fromEntries(header.map((name,i)=>[name,row[i]]));return converted.map(name=>name==='Valor total'?values['Valor da NF']:name==='Quant. desconto 1'?(values['Quantidade de caixas (quebra)']||'0'):name==='Desconto 1'?'Quebra':name==='Valor unitário desconto 1'||name==='Valor total desconto 1'?'0':values[name]);});
 const csv=[converted,...data].map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 return importLegacySheetCSV(csv,drivers,type).map(e=>({...e,saleSheet:{...e.saleSheet!,brokenBoxes:e.saleSheet!.discounts.reduce((sum,line)=>sum+line.quantity,0)}}));
}
function legacySheetCSVRows(expenses:Expense[],drivers:Driver[]):unknown[][] {
 const products=0;
 const discounts=Math.max(1,...expenses.map(e=>e.saleSheet?.discounts.length||0));
 const header=[...base];
 for(let i=1;i<=products;i++)header.push(`Quant. cxs ${i}`,`Espécie ${i}`,`Valor unitário ${i}`,`Valor total ${i}`);
 header.push('Total de cx','Valor total');
 for(let i=1;i<=discounts;i++)header.push(`Quant. desconto ${i}`,`Desconto ${i}`,`Valor unitário desconto ${i}`,`Valor total desconto ${i}`);
 header.push(...tail);
 return [header,...expenses.map(e=>{const s=e.saleSheet||emptySaleSheet();const t=saleTotals(s);const row:unknown[]=[e.date,s.saleNumber,s.company,new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long'}),s.city,s.state,s.paymentTerms,s.farm,e.invoice,num(s.invoiceValue)];
 for(let i=0;i<products;i++){const line=s.products[i];row.push(line?num(line.quantity):'',line?.species||'',line?num(line.unitPrice):'',line?num(line.quantity*line.unitPrice):'');}
 row.push(num(t.boxes),num(t.gross));
 for(let i=0;i<discounts;i++){const line=s.discounts[i];row.push(line?num(line.quantity):'',line?.species||'',line?num(line.unitPrice):'',line?num(line.quantity*line.unitPrice):'');}
 row.push(num(t.payable),drivers.find(d=>d.id===e.driverId)?.name||'',e.licensePlate,s.driverCity,s.driverState,num(s.freightPerBox),num(e.seguro),num(e.freightValue),s.notes);return row;})];
}
function importLegacySheetCSV(text:string,drivers:Driver[],type:'internal'|'external'):Omit<Expense,'id'>[] {
 const rows=parseCSV(text.replace(/^\uFEFF/,''));if(rows.length<2)throw new Error('O CSV não contém fichas.');
 const headers=rows[0].map(cell=>cell.trim());
 if(new Set(headers).size!==headers.length)throw new Error('Há colunas repetidas no CSV.');
 const products=headers.filter(h=>/^Espécie \d+$/.test(h)).length;
 const discounts=headers.filter(h=>/^Desconto \d+$/.test(h)).length;
 const expected=[...base];for(let i=1;i<=products;i++)expected.push(`Quant. cxs ${i}`,`Espécie ${i}`,`Valor unitário ${i}`,`Valor total ${i}`);expected.push('Total de cx','Valor total');for(let i=1;i<=discounts;i++)expected.push(`Quant. desconto ${i}`,`Desconto ${i}`,`Valor unitário desconto ${i}`,`Valor total desconto ${i}`);expected.push(...tail);
 if((!products && !headers.includes('Total de cx'))||!discounts||expected.some(h=>!headers.includes(h))||headers.length!==expected.length)throw new Error('Use o modelo CSV da ficha do papel.');
 return rows.slice(1).map((cells,index)=>{try{
  if(cells.length!==headers.length)throw new Error('Quantidade de colunas diferente do modelo.');
  const get=(name:string)=>cells[headers.indexOf(name)]||'';
  const money=(name:string)=>{const n=parseMoney(get(name));if(!Number.isFinite(n)||n<0)throw new Error(`Valor inválido em ${name}.`);return n;};
  let date=get('Data').trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(date))date=date.split('/').reverse().join('-');if(!validDate(date))throw new Error('Data inválida.');
  const matches=drivers.filter(d=>d.name.trim().toLocaleLowerCase('pt-BR')===get('Motorista').trim().toLocaleLowerCase('pt-BR'));if(matches.length!==1)throw new Error('Informe o nome de um motorista cadastrado, sem ambiguidades.');
  if(!get('Placa').trim())throw new Error('Informe a placa.');
  const s: import('../types').SaleSheet={...emptySaleSheet(),saleNumber:get('Venda nº'),company:get('Firma'),city:get('Cidade'),state:get('Estado'),paymentTerms:get('Prazo pag.'),farm:get('Roça'),invoiceValue:money('Valor da NF'),driverCity:get('Cidade do motorista'),driverState:get('Estado do motorista'),freightPerBox:money('Valor do frete por cx'),notes:get('Obs.')};
  if(products===0)s.totalBoxes=money('Total de cx');
  for(let i=1;i<=products;i++)if([`Quant. cxs ${i}`,`Espécie ${i}`,`Valor unitário ${i}`].some(h=>get(h)!==''))s.products.push({id:crypto.randomUUID(),species:get(`Espécie ${i}`),quantity:money(`Quant. cxs ${i}`),unitPrice:money(`Valor unitário ${i}`)});
  for(let i=1;i<=discounts;i++)if([`Quant. desconto ${i}`,`Desconto ${i}`,`Valor unitário desconto ${i}`].some(h=>get(h)!==''))s.discounts.push({id:crypto.randomUUID(),species:get(`Desconto ${i}`),quantity:money(`Quant. desconto ${i}`),unitPrice:money(`Valor unitário desconto ${i}`)});
  return {date,driverId:matches[0].id,licensePlate:get('Placa').trim().toUpperCase(),invoice:get('Nº NF'),freightValue:money('Valor total do frete'),seguro:money('Valor do seguro'),destination:s.city,type,saleSheet:s,thirdPartyFreight:0,fueling:0,toll:0,driverExpenses:0,entryOdometer:0,exitOdometer:0};
 }catch(error){throw new Error(`Linha ${index+2}: ${error instanceof Error?error.message:'dados inválidos'}`);}});
}
const currentHeaders=['Nº NF','Data','Firma','Dia da semana','Cidade','Estado','Roça','Total de cx','Motorista','Placa','Valor do frete por cx','Valor do seguro','Valor total do frete','Abastecimento','Km de saída','Km de chegada','Despesas do motorista','Pedágio','Obs.'];
export function sheetCSVRows(expenses:Expense[],drivers:Driver[]):unknown[][] {
 return [currentHeaders,...expenses.map(e=>{const s=e.saleSheet||emptySaleSheet();return [e.invoice,e.date,s.company,new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long'}),s.city,s.state,s.farm,num(saleTotals(s).boxes),drivers.find(d=>d.id===e.driverId)?.name||'',e.licensePlate,num(s.freightPerBox),num(e.seguro),num(e.freightValue),num(e.fueling),num(e.entryOdometer),num(e.exitOdometer),num(e.driverExpenses),num(e.toll),s.notes];})];
}
export function importSheetCSV(text:string,drivers:Driver[],type:'internal'|'external'):Omit<Expense,'id'>[] {
 const rows=parseCSV(text.replace(/^\uFEFF/,''));if(!rows[0]?.includes('Abastecimento'))return importPreviousSheetCSV(text,drivers,type);
 const header=rows[0];if(rows.length<2 || (header.length!==currentHeaders.length && header.length!==currentHeaders.length+2) || currentHeaders.some(name=>!header.includes(name)) || header.some(name=>!currentHeaders.includes(name) && !['Cidade do motorista','Estado do motorista'].includes(name)) || new Set(header).size!==header.length)throw new Error('Use o modelo CSV atual.');
 const legacyHeader=[...base,'Total de cx',...tail];
 const values=rows.slice(1).map((row,index)=>{if(row.length!==header.length)throw new Error(`Linha ${index+2}: quantidade de colunas inválida.`);return Object.fromEntries(header.map((name,i)=>[name,row[i]]));});
 const converted=[legacyHeader,...values.map(row=>legacyHeader.map(name=>row[name]||''))].map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(';')).join('\r\n');
 return importPreviousSheetCSV(converted,drivers,type).map((e,index)=>{
 const value=values[index];const number=(name:string)=>{const n=parseMoney(value[name]);if(!Number.isFinite(n)||n<0)throw new Error(`Linha ${index+2}: valor inválido em ${name}.`);return n;};
 const start=number('Km de saída'),end=number('Km de chegada');if(end<start)throw new Error(`Linha ${index+2}: km de chegada menor que km de saída.`);
 return {...e,fueling:number('Abastecimento'),entryOdometer:start,exitOdometer:end,driverExpenses:number('Despesas do motorista'),toll:number('Pedágio')};
 });
}

