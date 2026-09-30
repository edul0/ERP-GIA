import { jsPDF } from 'jspdf';
import type { Driver, Expense } from '../types';
import { currency, displayDate, sumMoney, tripCosts } from './finance';

export interface ReportOptions {
  title: string;
  subtitle: string;
  columns: string[];
  widths: number[];
  rows: string[][];
  summary: [string, string][];
  note?: string;
  logo?: string;
}

// Vector text and explicit page boundaries keep reports readable when printed.
export function buildReport(options: ReportOptions): jsPDF {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margin = 12, bottom = 194, lineHeight = 4;
  let y = 0;
  const tableHeader = () => {
    pdf.setFillColor(11, 51, 34); pdf.rect(margin, y, 273, 10, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(255);
    let x = margin;
    options.columns.forEach((column, index) => { pdf.text(column, x + 2, y + 6.5); x += options.widths[index]; });
    y += 10;
  };
  const header = (first: boolean) => {
    pdf.setTextColor(11, 51, 34); pdf.setFont('helvetica', 'bold');
    if (options.logo) pdf.addImage(options.logo, 'PNG', margin, 10, 62, 12.25);
    else { pdf.setFontSize(12); pdf.text('ERP GIA', margin, 18); }
    pdf.setFontSize(9); pdf.text('ERP GIA | RELATÓRIO GERENCIAL', 285, 17, { align: 'right' });
    pdf.setDrawColor(23, 102, 60); pdf.setLineWidth(.7); pdf.line(margin, 27, 285, 27);
    pdf.setFontSize(18); pdf.text(options.title, margin, 37);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(83, 105, 91);
    pdf.text(pdf.splitTextToSize(options.subtitle, 270), margin, 44);
    y = 53;
    if (first) {
      const width = (273 - (options.summary.length - 1) * 4) / options.summary.length;
      options.summary.forEach(([label, value], index) => {
        const x = margin + index * (width + 4);
        pdf.setFillColor(239, 246, 240); pdf.roundedRect(x, y, width, 19, 2, 2, 'F');
        pdf.setFontSize(8); pdf.text(label, x + 3, y + 6);
        pdf.setTextColor(11, 51, 34); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text(value, x + 3, y + 14);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(83, 105, 91);
      });
      y += 24;
      if (options.note) { pdf.setFontSize(8); const lines = pdf.splitTextToSize(options.note, 270); pdf.text(lines, margin, y); y += lines.length * 4 + 4; }
    }
    tableHeader();
  };
  header(true);
  const rows = options.rows.length ? options.rows : [['Nenhum registro no período.', ...options.columns.slice(1).map(() => '')]];
  rows.forEach((row, rowIndex) => {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
    const cells: string[][] = row.map((cell, index) => pdf.splitTextToSize(String(cell), options.widths[index] - 4));
    let offset = 0;
    const count = Math.max(...cells.map(cell => cell.length));
    while (offset < count) {
      if (y + 9 > bottom) { pdf.addPage(); header(false); }
      const remaining = Math.floor((bottom - y - 5) / lineHeight);
      const take = Math.min(count - offset, Math.max(1, remaining));
      const height = take * lineHeight + 5;
      pdf.setFillColor(...(rowIndex % 2 === 0 ? [247, 250, 247] : [255, 255, 255]) as [number, number, number]);
      pdf.rect(margin, y, 273, height, 'F');
      pdf.setTextColor(32, 55, 40); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
      let x = margin;
      cells.forEach((cell, index) => { const part = cell.slice(offset, offset + take); if (part.length) pdf.text(part, x + 2, y + 5); x += options.widths[index]; });
      pdf.setDrawColor(222, 231, 224); pdf.setLineWidth(.15); pdf.line(margin, y + height, 285, y + height);
      y += height; offset += take;
    }
  });
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(98, 116, 102);
    pdf.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, margin, 203);
    pdf.text(`Página ${page} de ${pages}`, 285, 203, { align: 'right' });
  }
  return pdf;
}

export async function reportLogo(): Promise<string | undefined> {
  return undefined;
}

export async function expenseReport(title: string, expenses: Expense[], drivers: Driver[], subtitle = 'Lançamentos conforme os filtros selecionados') {
  const revenue = sumMoney(expenses, expense => expense.freightValue), costs = sumMoney(expenses, tripCosts);
  return buildReport({ title, subtitle: `${subtitle} | ${expenses.length} lançamento(s)`, logo: await reportLogo(),
    summary: [['Receitas registradas', currency(revenue)], ['Despesas das viagens', currency(costs)], ['Resultado antes de tributos', currency(Math.round((revenue - costs) * 100) / 100)]],
    note: 'Resultado dos fretes antes de tributos, manutenção, depreciação e despesas administrativas. Este relatório não é um documento fiscal.',
    columns: ['Data', 'Motorista', 'Placa', 'Destino', 'Receita', 'Despesas', 'Resultado'], widths: [22, 40, 24, 85, 34, 34, 34],
    rows: expenses.map(expense => [displayDate(expense.date), drivers.find(driver => driver.id === expense.driverId)?.name || expense.driverId, expense.licensePlate, expense.destination, currency(expense.freightValue), currency(tripCosts(expense)), currency(Math.round((expense.freightValue - tripCosts(expense)) * 100) / 100)])
  });
}
