import { expenseReport } from '../lib/report';
import { currency, displayDate, localDateKey, monthlyTotals, sumMoney, tripCosts } from '../lib/finance';
import React, { useState, useRef } from 'react';
import { Expense, Driver, Truck, MaintenanceRecord } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  TrendingUp,
  Truck as TruckIcon,
  Users,
  Wrench,
  AlertCircle,
  BarChart3,
  DollarSign,
  Printer,
  Settings
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface DashboardProps {
  expenses: Expense[];
  drivers: Driver[];
  trucks: Truck[];
  maintenance: MaintenanceRecord[];
}

export const ExecutiveDashboard: React.FC<DashboardProps> = ({ expenses, drivers, trucks, maintenance }) => {
  const [showWidgets, setShowWidgets] = useState({
    financial: true,
    maintenanceCost: true,
    maintenanceDist: true,
    criticalItems: true
  });
  const [chartPeriod, setChartPeriod] = useState<'six' | 'year' | 'all'>('all');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    try {
      const pdf = await expenseReport('Resumo financeiro da operação', expenses, drivers, 'Todo o histórico de viagens');
      pdf.save('painel-executivo.pdf');
    } catch { window.alert('Não foi possível gerar o relatório. Tente novamente.'); }
  };

  // Calculations
  const totalRevenue = sumMoney(expenses, expense => expense.freightValue);
  const totalExpenses = sumMoney(expenses, tripCosts);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const activeTrucks = trucks.filter(t => t.status === 'active').length;
  const maintenanceTrucks = trucks.filter(t => t.status === 'maintenance').length;
  const pendingMaintenance = maintenance.filter(m => m.status === 'pending').length;

  const chartData = monthlyTotals(expenses, chartPeriod);

  const maintenanceData = [
    { name: 'Pneus', value: maintenance.filter(m => m.type === 'tire').length },
    { name: 'Óleo', value: maintenance.filter(m => m.type === 'oil').length },
    { name: 'Preventiva', value: maintenance.filter(m => m.type === 'preventive').length },
    { name: 'Corretiva', value: maintenance.filter(m => m.type === 'corrective').length },
  ];

  // Maintenance cost per truck
  const truckMaintenanceCosts = trucks.map(truck => {
    const cost = maintenance
      .filter(m => m.truckId === truck.id)
      .reduce((sum, m) => sum + m.cost, 0);
    return { ...truck, maintenanceCost: cost };
  }).sort((a, b) => b.maintenanceCost - a.maintenanceCost);

  const COLORS = ['#17663c', '#8fc5a0', '#b58a38', '#c85b50'];

  return (
    <div ref={dashboardRef} className="executive-dashboard space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap relative">
        <div><p className="eyebrow">GESTÃO DE FROTA</p><h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Visão geral da operação</h1><p className="mt-2 text-sm text-gray-500">Receitas e despesas registradas. Resultado antes de tributos e manutenção.</p></div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto relative" data-html2canvas-ignore="true">
            <button
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition font-medium text-sm"
            >
                <Settings className="w-4 h-4" />
                Customizar Visão
            </button>
            {isConfigOpen && (
              <div className="absolute top-12 right-0 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-10 w-64">
                <h4 className="font-bold text-gray-800 mb-3 text-sm border-b pb-2">Widgets Ativos</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showWidgets.financial} onChange={() => setShowWidgets({...showWidgets, financial: !showWidgets.financial})} />
                    Desempenho Financeiro
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showWidgets.maintenanceCost} onChange={() => setShowWidgets({...showWidgets, maintenanceCost: !showWidgets.maintenanceCost})} />
                    Gastos por Veículo
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showWidgets.maintenanceDist} onChange={() => setShowWidgets({...showWidgets, maintenanceDist: !showWidgets.maintenanceDist})} />
                    Distribuição da Manutenção
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showWidgets.criticalItems} onChange={() => setShowWidgets({...showWidgets, criticalItems: !showWidgets.criticalItems})} />
                    Itens Críticos
                  </label>
                </div>
              </div>
            )}
            <button
                onClick={handlePrint}
                className="no-print flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-brand-600 transition font-medium text-sm"
            >
                <Printer className="w-4 h-4" />
                Imprimir Relatório
            </button>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-brand-50 rounded-lg"><DollarSign className="text-brand-600 w-6 h-6" /></span>
            <span className="text-xs font-medium text-gray-500">Total registrado</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Faturamento Bruto</p>
            <p className="text-2xl font-bold text-gray-800">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="text-emerald-600 w-6 h-6" /></span>
            <span className="text-xs font-bold text-emerald-500">{margin.toFixed(1)}% Margem</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Resultado das viagens</p>
            <p className="text-2xl font-bold text-emerald-600">{netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-orange-50 rounded-lg"><TruckIcon className="text-orange-600 w-6 h-6" /></span>
            <span className="text-xs font-bold text-gray-500">{activeTrucks}/{trucks.length} Ativos</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Frota Operacional</p>
            <p className="text-2xl font-bold text-gray-800">{activeTrucks} Caminhões</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-red-50 rounded-lg"><Wrench className="text-red-600 w-6 h-6" /></span>
            {pendingMaintenance > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Manutenções Pendentes</p>
            <p className="text-2xl font-bold text-gray-800">{pendingMaintenance} Ordens</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart */}
        {showWidgets.financial && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600" /> Desempenho Financeiro
            </h3>
            <select aria-label="Período do gráfico" value={chartPeriod} onChange={e => setChartPeriod(e.target.value as typeof chartPeriod)} className="text-sm border-none bg-gray-50 rounded px-2 py-1">
              <option value="all">Todo o histórico</option>
              <option value="six">Últimos 6 meses</option>
              <option value="year">Ano atual até hoje</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8ba393', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8ba393', fontSize: 12}} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => [currency(Number(value)), name]}
                />
                <Bar dataKey="receita" fill="#17663c" radius={[4, 4, 0, 0]} barSize={30} name="Receita" />
                <Bar dataKey="despesa" fill="#8ba393" radius={[4, 4, 0, 0]} barSize={30} name="Despesa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Maintenance cost per truck */}
        {showWidgets.maintenanceCost && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" /> Gastos de Manutenção por Veículo
          </h3>
          <div className="space-y-4">
            {truckMaintenanceCosts.map((truck) => (
              <div key={truck.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{truck.plate} ({truck.model})</span>
                  <span className="font-bold text-gray-900">{truck.maintenanceCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (truck.maintenanceCost / Math.max(...truckMaintenanceCosts.map(t => t.maintenanceCost), 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Maintenance breakdown */}
        {showWidgets.maintenanceDist && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-emerald-600" /> Distribuição de Manutenção
          </h3>
          <div className="relative h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={maintenanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {maintenanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />

              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-800">{maintenance.length}</span>
              <span className="text-xs text-gray-500 uppercase">Total</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Critical Items */}
      {showWidgets.criticalItems && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> Alertas Críticos e Preventivas
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {/* Alertas de Quilometragem */}
          {trucks.filter(t => t.nextMaintenanceOdometer && (t.nextMaintenanceOdometer - t.lastOdometer) <= 1000).map(t => {
            const distance = (t.nextMaintenanceOdometer || 0) - t.lastOdometer;
            const isOverdue = distance <= 0;
            return (
              <div key={`km-${t.id}`} className="p-4 bg-orange-50/50 hover:bg-orange-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <AlertCircle className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isOverdue ? 'text-red-800' : 'text-orange-800'}`}>
                       Troca de óleo / Revisão próxima para o caminhão {t.plate}
                    </p>
                    <p className="text-xs text-gray-500">Hodômetro Atual: {t.lastOdometer}km • Limite: {t.nextMaintenanceOdometer}km</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isOverdue ? 'Passou do Limite' : `Faltam ${distance}km`}
                  </span>
                </div>
              </div>
            );
          })}

          {maintenance.filter(m => m.status === 'pending').map(m => (
            <div key={m.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-50 rounded-full">
                  <Wrench className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{m.description}</p>
                  <p className="text-xs text-gray-500">ID Caminhão: {m.truckId} • Previsto para: {displayDate(m.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">{m.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xxs font-bold uppercase tracking-wider">{m.date < localDateKey() ? 'Atrasado' : 'Agendado'}</span>
              </div>
            </div>
          ))}
          {maintenance.filter(m => m.status === 'pending').length === 0 && trucks.filter(t => t.nextMaintenanceOdometer && (t.nextMaintenanceOdometer - t.lastOdometer) <= 1000).length === 0 && (
            <div className="p-10 text-center text-gray-400">Nenhum alerta crítico detectado.</div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
