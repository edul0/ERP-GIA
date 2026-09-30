import { buildReport, reportLogo } from '../lib/report';
import React, { useState } from 'react';
import type { Expense } from '../types';
import { Download, Printer } from 'lucide-react';
import { costFields, costLabels, currency, inPeriod, localDateKey, Period, sumMoney, tripCosts } from '../lib/finance';
import { downloadCSV } from '../lib/csv';

export const DRE: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
  const [period, setPeriod] = useState<Period>('all');
  const [reference, setReference] = useState(localDateKey());
  const [taxRate, setTaxRate] = useState('');
  const filtered = expenses.filter(expense => inPeriod(expense.date, period, reference));
  const revenue = sumMoney(filtered, expense => expense.freightValue);
  const costs = sumMoney(filtered, tripCosts);
  const rate = Number(taxRate);
  const hasTax = taxRate.trim() !== '' && Number.isFinite(rate) && rate >= 0 && rate <= 100;
  const taxes = hasTax ? Math.round(revenue * rate) / 100 : 0;
  const balance = Math.round((revenue - costs - taxes) * 100) / 100;
  const periodLabel = period === 'all' ? 'Todo o histórico' : `${{ daily: 'Dia', weekly: '7 dias até', monthly: 'Mês de' }[period]} ${reference}`;
  const exportPDF = async () => {
    try {
      const pdf = buildReport({
        title: 'Resultado das viagens', subtitle: periodLabel, logo: await reportLogo(),
        summary: [['Receitas', currency(revenue)], ['Despesas', currency(costs)], ['Resultado', currency(balance)]],
        note: hasTax ? 'Resultado após estimativa de tributos. Não inclui manutenção, depreciação ou custos administrativos.' : 'Tributos não informados. Não inclui manutenção, depreciação ou custos administrativos.',
        columns: ['Composição', 'Valor'], widths: [213, 60],
        rows: [...costFields.map(key => [costLabels[key], currency(sumMoney(filtered, expense => expense[key]))]),
          ['Tributos estimados', hasTax ? currency(taxes) + ' (' + rate + '%)' : 'Não informado']]
      });
      pdf.save('resultado-viagens.pdf');
    } catch { window.alert('Não foi possível gerar o PDF. Tente novamente.'); }
  };
  const exportCSV = () => downloadCSV('resultado-viagens.csv', [
    ['Data', 'Placa', 'Receita', ...costFields.map(key => costLabels[key]), 'Total de despesas', 'Resultado antes de tributos'],
    ...filtered.map(expense => [expense.date, expense.licensePlate, expense.freightValue, ...costFields.map(key => expense[key] ?? 0), tripCosts(expense), Math.round((expense.freightValue - tripCosts(expense)) * 100) / 100])
  ]);
  return <div className="space-y-6 pb-10">
    <div className="flex flex-wrap gap-4 items-start justify-between">
      <div><p className="eyebrow">FINANCEIRO</p><h1 className="text-3xl font-bold text-brand-900">Resultado das viagens</h1><p className="text-sm text-gray-500 mt-2">Receitas e todos os custos dos fretes registrados.</p></div>
      <div className="flex gap-2"><button className="action-secondary" onClick={exportPDF}><Printer size={16} /> Exportar PDF</button><button className="action-primary" onClick={exportCSV}><Download size={16} /> CSV</button></div>
    </div>
    <div className="surface flex flex-wrap gap-4 items-end">
      <label className="field-label">Período<select value={period} onChange={e => setPeriod(e.target.value as Period)}><option value="all">Todo o histórico</option><option value="daily">Diário</option><option value="weekly">Últimos 7 dias</option><option value="monthly">Mensal</option></select></label>
      {period !== 'all' && <label className="field-label">Data de referência<input type="date" value={reference} onChange={e => setReference(e.target.value)} /></label>}
      <label className="field-label">Tributos estimados (%)<input aria-label="Tributos estimados (%)" type="number" min="0" max="100" step="0.01" value={taxRate} placeholder="Não informado" onChange={e => setTaxRate(e.target.value)} /></label>
      <p className="text-xs text-gray-500 pb-3">{filtered.length} lançamento(s) no período</p>
    </div>
    {taxRate !== '' && !hasTax && <p role="alert" className="text-red-700">Informe uma alíquota entre 0 e 100%.</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[['Faturamento bruto', currency(revenue)], ['Despesas das viagens', currency(costs)], ['Tributos estimados', hasTax ? currency(taxes) : 'Não informado'], [hasTax ? 'Resultado após estimativa' : 'Resultado antes de tributos', currency(balance)]].map(([label, value], index) => <div key={label} className={`surface ${index === 3 ? 'bg-brand-50 border-brand-200' : ''}`}><p className="text-sm text-gray-500">{label}</p><p className={`text-2xl font-bold mt-3 ${index === 3 && balance < 0 ? 'text-red-700' : 'text-brand-900'}`}>{value}</p></div>)}
    </div>
    <p className="text-sm text-gray-500">Visão gerencial dos fretes. Não inclui manutenção, depreciação ou custos administrativos; não substitui o DRE contábil nem o fluxo de recebimentos e pagamentos.</p>
    <div className="surface"><h2 className="text-lg font-bold text-brand-900 mb-4">Composição das despesas</h2>{costFields.map(key => <div key={key} className="flex justify-between gap-3 border-b border-gray-100 py-3 last:border-0"><span className="text-gray-600">{costLabels[key]}</span><strong>{currency(sumMoney(filtered, expense => expense[key]))}</strong></div>)}{filtered.length === 0 && <p className="text-gray-500 py-4">Nenhum lançamento neste período. Ajuste os filtros para consultar o histórico.</p>}</div>
  </div>;
};
