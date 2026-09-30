import { expenseReport } from '../lib/report';
import { csvCell } from '../lib/csv';
import { tripCosts } from '../lib/finance';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Expense, Driver, View } from '../types';
import { 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Check, 
  AlertTriangle,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  Printer
} from 'lucide-react';
import { ExpensesModal } from './ExpensesModal';
import { ConfirmDialog } from './ConfirmDialog';
import { ImportModal } from './ImportModal';
import { DanfeModal } from './DanfeModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExpensesListProps {
  expenses: Expense[];
  drivers: Driver[];
  type: 'internal' | 'external';
  isAdmin?: boolean;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onImportExpenses: (expenses: Omit<Expense, 'id'>[]) => void;
  showToast: (message: string, duration?: number) => void;
  onBulkUpdate: (updates: Expense[], additions: Omit<Expense, 'id'>[], deletions: string[]) => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ 
  expenses, drivers, type, isAdmin, onAddExpense, onUpdateExpense, onDeleteExpense, onImportExpenses, showToast, onBulkUpdate 
}) => {
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterPlate, setFilterPlate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const [danfeExpense, setDanfeExpense] = useState<Expense | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const driverMap = useMemo(() => new Map(drivers.map(d => [d.id, d.name])), [drivers]);

  const uniquePlates = useMemo(() => {
    const plates = expenses.map(exp => exp.licensePlate).filter(Boolean);
    return Array.from(new Set(plates)).sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const date = new Date(exp.date + 'T12:00:00');
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      
      const matchDriver = filterDriver === 'all' || exp.driverId === filterDriver;
      const matchYear = filterYear === 'all' || year === parseInt(filterYear);
      const matchMonth = filterMonth === 'all' || month === parseInt(filterMonth);
      const matchPlate = filterPlate === 'all' || exp.licensePlate.toLowerCase() === filterPlate.toLowerCase();
      
      const driverName = driverMap.get(exp.driverId) || '';
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || 
        exp.licensePlate.toLowerCase().includes(query) || 
        (exp.invoice || '').toLowerCase().includes(query) || 
        (exp.clientName || '').toLowerCase().includes(query) ||
        (exp.destination || '').toLowerCase().includes(query) ||
        driverName.toLowerCase().includes(query);
      
      return matchDriver && matchYear && matchMonth && matchPlate && matchSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterDriver, filterYear, filterMonth, filterPlate, searchQuery, driverMap]);

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('Nenhum registro encontrado para exportar.');
      return;
    }

    const headers = [
      'Data',
      'Motorista',
      'Placa',
      'Localizacao (Origem - Destino)',
      'Cliente_Mercadoria',
      'Valor_Frete',
      'Abastecimento',
      'Despesas_Motorista',
      'Pedagio',
      'NF',
      'Frete_Terceiro',
      'Seguro',
      'Carga_Descarga',
      'Multas',
      'Outros',
      'Total_Custos',
      'Resultado_Liquido',
      'Tipo'
    ];

    const csvRows = [headers.join(';')];

    filteredExpenses.forEach(exp => {
      const driverName = driverMap.get(exp.driverId) || 'EX-FROTA';
      const costs = tripCosts(exp);
      const net = exp.freightValue - costs;
      
      const row = [
        new Date(exp.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        driverName,
        exp.licensePlate,
        exp.destination,
        exp.clientName || '',
        exp.freightValue,
        exp.fueling,
        exp.driverExpenses,
        exp.toll,
        exp.invoice || '',
        exp.thirdPartyFreight,
        exp.seguro,
        exp.loadingUnloading || 0,
        exp.fines || 0,
        exp.others || 0,
        costs,
        net,
        exp.type === 'internal' ? 'Frota Própria' : 'Terceiro'
      ];
      csvRows.push(row.map(csvCell).join(';'));
    });

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `despesas_viagens_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Exportado com sucesso para CSV!');
  };

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await expenseReport(type === 'internal' ? 'Fretes da frota interna' : 'Fretes de terceiros', filteredExpenses, drivers);
      pdf.save('relatorio-fretes.pdf');
      showToast('PDF exportado com sucesso.');
    } catch { showToast('Não foi possível gerar o relatório. Tente novamente.'); }
    finally { setIsGeneratingPdf(false); }
  };

  const stats = useMemo(() => {
    const revenue = filteredExpenses.reduce((sum, exp) => sum + exp.freightValue, 0);
    const costs = filteredExpenses.reduce((sum, exp) => 
      sum + tripCosts(exp), 0);
    return { revenue, costs, net: revenue - costs };
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      {/* Mini Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-emerald-500">
          <p className="text-sm text-gray-500 font-medium">Receita {type === 'internal' ? 'Frotas' : 'Terceiros'}</p>
          <p className="text-xl font-bold text-gray-800">{stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-gray-500 font-medium">Custos Operacionais</p>
          <p className="text-xl font-bold text-gray-800">{stats.costs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-brand-500">
          <p className="text-sm text-gray-500 font-medium">Margem Operacional</p>
          <p className="text-xl font-bold text-gray-800">{stats.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-brand-600" /> Registros de Viagens
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
             <button 
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-md hover:bg-emerald-700 transition cursor-pointer"
            >
              <Download size={18} className="mr-2" /> Exportar CSV
            </button>
             <button 
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
            >
              <Printer size={18} className="mr-2" /> {isGeneratingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
            </button>
             <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
            >
              <Upload size={18} className="mr-2" /> Importar
            </button>
            <button 
              onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
              className="flex items-center px-4 py-2 bg-brand-600 text-white font-bold rounded-lg shadow-md hover:bg-brand-700 transition"
            >
              <Plus size={18} className="mr-2" /> Novo Frete
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Motorista</label>
            <select 
              value={filterDriver} 
              onChange={e => setFilterDriver(e.target.value)}
              className="w-full p-2 border rounded bg-white text-sm"
            >
              <option value="all">Todos os Motoristas</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Placa do Veículo</label>
            <select 
              value={filterPlate} 
              onChange={e => setFilterPlate(e.target.value)}
              className="w-full p-2 border rounded bg-white text-sm"
            >
              <option value="all">Todas as Placas</option>
              {uniquePlates.map(plate => <option key={plate} value={plate}>{plate}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mês</label>
            <select 
              value={filterMonth} 
              onChange={e => setFilterMonth(e.target.value)}
              className="w-full p-2 border rounded bg-white text-sm"
            >
              <option value="all">Todos os Meses</option>
              {Array.from({length: 12}).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
             <div className="flex w-full items-center px-3 py-2 border rounded bg-white gap-2">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar NF, Placa, Cliente..." 
                  className="text-sm outline-none w-full" 
                />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100 hidden md:block">
          <table className="w-full text-left table-auto min-w-[1000px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Motorista</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Placa</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Localização</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Valor Frete</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Custos</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Líquido</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.map(exp => {
                 const costs = tripCosts(exp);
                 const net = exp.freightValue - costs;
                 return (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-3 text-sm text-gray-600 font-medium">{new Date(exp.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="p-3 text-sm font-semibold text-gray-800">{driverMap.get(exp.driverId) || 'EX-FROTA'}</td>
                    <td className="p-3 text-sm text-gray-600 font-mono tracking-wider">{exp.licensePlate}</td>
                    <td className="p-3 text-sm text-gray-600">
                      <div>{exp.destination}</div>
                      {exp.clientName && <div className="text-xs text-brand-600 font-medium mt-0.5">{exp.clientName}</div>}
                    </td>
                    <td className="p-3 text-sm font-bold text-emerald-600 text-right">{exp.freightValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-3 text-sm text-red-500 text-right">{costs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className={`p-3 text-sm font-bold text-right ${net < 0 ? 'text-red-600' : 'text-brand-600'}`}>
                      {net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        {exp.receiptImage && (
                          <button 
                            onClick={() => {
                               const win = window.open();
                               if (win) {
                                 win.document.write(`<iframe src="${exp.receiptImage}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                               }
                            }}
                            title="Ver Comprovante"
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => setDanfeExpense(exp)}
                          title="Gerar DANFE/CTe"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => { setToDelete(exp); setIsConfirmOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                 )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredExpenses.map(exp => {
            const costs = tripCosts(exp);
            const net = exp.freightValue - costs;
            return (
              <div key={exp.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">{new Date(exp.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p className="font-bold text-gray-800">{driverMap.get(exp.driverId) || 'EX-FROTA'}</p>
                    <p className="text-xs text-gray-500 font-mono">{exp.licensePlate}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setDanfeExpense(exp)} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg"><FileText size={16} /></button>
                    <button onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }} className="p-2 text-brand-600 bg-brand-50 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => { setToDelete(exp); setIsConfirmOpen(true); }} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Localização:</span>
                    <div className="font-medium text-gray-800 text-right">
                       <div>{exp.destination}</div>
                       {exp.clientName && <div className="text-brand-600">{exp.clientName}</div>}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Resultado:</span>
                    <span className={`font-bold ${net < 0 ? 'text-red-600' : 'text-brand-600'}`}>
                      {net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <ExpensesModal 
          isOpen={isModalOpen}
          type={type}
          isAdmin={isAdmin}
          drivers={drivers}
          expense={editingExpense}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingExpense) onUpdateExpense({ ...data, id: editingExpense.id } as Expense);
            else onAddExpense(data as Omit<Expense, 'id'>);
            setIsModalOpen(false);
          }}
        />
      )}

      {isConfirmOpen && toDelete && (
        <ConfirmDialog 
          isOpen={isConfirmOpen}
          title="Excluir Registro"
          message={`Confirmar a exclusão do registro de frete para ${toDelete.destination}?`}
          onConfirm={() => { onDeleteExpense(toDelete.id); setIsConfirmOpen(false); }}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}

      {isImportModalOpen && (
        <ImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={onImportExpenses}
            type={type}
        />
      )}

      {danfeExpense && (
        <DanfeModal 
          expense={danfeExpense}
          driverName={driverMap.get(danfeExpense.driverId)}
          onClose={() => setDanfeExpense(null)}
        />
      )}

      {/* Printable Area for PDF Generation */}
      <div id="printableArea" className="print-only absolute -left-full top-0 w-[800px] bg-white p-8 text-black">
        <div className="print-header mb-8 text-center">
          <h1 className="text-3xl font-bold">ERP GIA - Gestão de Frota</h1>
          <h2 className="text-xl text-gray-600 mt-2">
            Controle de Viagens e Custos ({type === 'internal' ? 'Frota Própria' : 'Frota Terceira'})
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6 print-summary">
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Período Selecionado</p>
            <p className="font-semibold text-gray-800">
              {filterMonth === 'all' ? 'Todos os Meses' : new Date(0, parseInt(filterMonth) - 1).toLocaleString('pt-BR', {month: 'long'})} - {filterYear === 'all' ? 'Todos os Anos' : filterYear}
            </p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Filtros Aplicados</p>
            <p className="font-semibold text-gray-800 text-sm">
              Placa: {filterPlate === 'all' ? 'Todas' : filterPlate} | Motorista: {filterDriver === 'all' ? 'Todos' : driverMap.get(filterDriver) || 'Todos'}
            </p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Receita Total</p>
            <p className="text-lg font-bold text-emerald-700">{stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Custos Totais</p>
            <p className="text-lg font-bold text-red-600">{stats.costs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg col-span-2">
            <p className="text-sm text-green-800">Margem Operacional Líquida</p>
            <p className="text-xl font-bold text-green-800">{stats.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 print-section-title">Detalhamento das Viagens</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Motorista</th>
                <th>Placa</th>
                <th>Localização</th>
                <th>Cliente / Mercadoria</th>
                <th style={{ textAlign: 'right' }}>Receita (R$)</th>
                <th style={{ textAlign: 'right' }}>Custos (R$)</th>
                <th style={{ textAlign: 'right' }}>Líquido (R$)</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => {
                const costs = tripCosts(exp);
                const net = exp.freightValue - costs;
                return (
                  <tr key={exp.id}>
                    <td>{new Date(exp.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="font-semibold">{driverMap.get(exp.driverId) || 'EX-FROTA'}</td>
                    <td>{exp.licensePlate}</td>
                    <td>{exp.destination}</td>
                    <td>{exp.clientName || '-'}</td>
                    <td className="currency">{exp.freightValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="currency">{costs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={`currency font-bold ${net < 0 ? 'text-red-700' : 'text-brand-700'}`}>
                      {net.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="print-footer border-t pt-4 text-center text-xs text-gray-500">
          <p>© 2026 ERP GIA - Gestão operacional.</p>
        </div>
      </div>
    </div>
  );
};
