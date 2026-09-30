import { expenseReport } from '../lib/report';
import { tripCosts } from '../lib/finance';

import React, { useMemo, useState } from 'react';
import { Expense, Driver } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { DocumentDownloadIcon } from './icons/DocumentDownloadIcon';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SearchableSelect from './SearchableSelect';
import { downloadFile } from '../utils/download';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AdvancedReportsProps {
  expenses: Expense[];
  drivers: Driver[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; }> = ({ title, value, icon, subtext }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-start space-x-4">
        <div className="bg-green-100 p-3 rounded-full">
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const AdvancedReports: React.FC<AdvancedReportsProps> = ({ expenses, drivers }) => {
    const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [driverSearchTerm, setDriverSearchTerm] = useState<string>('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const driverMap = useMemo(() => new Map(drivers.map(d => [d.id, d.name])), [drivers]);

    const driverOptionsForFilter = useMemo(() => [
        { id: 'all', name: 'Todos os Motoristas' },
        ...drivers
    ], [drivers]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    const filteredExpenses = useMemo(() => {
        let expensesToFilter = expenses;

        if (selectedDriverId !== 'all') {
            expensesToFilter = expensesToFilter.filter(e => e.driverId === selectedDriverId);
        }
        
        // Add timezone offset to avoid off-by-one day errors with UTC dates
        if (startDate) {
            const start = new Date(startDate);
            start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
            expensesToFilter = expensesToFilter.filter(e => e.date >= startDate);
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
            expensesToFilter = expensesToFilter.filter(e => e.date <= endDate);
        }

        return expensesToFilter;
    }, [expenses, selectedDriverId, startDate, endDate]);

    const overallStats = useMemo(() => {
        // FIX: Ensure all values are treated as numbers to prevent type errors from string concatenation.
        const totalFreight = filteredExpenses.reduce((sum, e) => sum + (Number(e.freightValue) || 0), 0);
        const totalExpensesValue = filteredExpenses.reduce((sum, e) => sum + tripCosts(e), 0);
        const netResult = totalFreight - totalExpensesValue;
        const totalKm = filteredExpenses.reduce((sum, e) => sum + ((Number(e.exitOdometer) || 0) - (Number(e.entryOdometer) || 0)), 0);
        return { totalFreight, totalExpenses: totalExpensesValue, netResult, totalKm };
    }, [filteredExpenses]);

    const expenseBreakdown = useMemo(() => {
        // Fix: Explicitly typing the breakdown object and casting values to Number ensures correct type inference and prevents calculation errors.
        const breakdown: {
            fueling: number;
            toll: number;
            driverExpenses: number;
            thirdPartyFreight: number;
            seguro: number;
            loadingUnloading: number; fines: number; others: number;
        } = {
            fueling: 0,
            toll: 0,
            driverExpenses: 0,
            thirdPartyFreight: 0,
            seguro: 0, loadingUnloading: 0, fines: 0, others: 0,
        };
        for (const expense of filteredExpenses) {
            breakdown.fueling += Number(expense.fueling) || 0;
            breakdown.toll += Number(expense.toll) || 0;
            breakdown.driverExpenses += Number(expense.driverExpenses) || 0;
            breakdown.thirdPartyFreight += Number(expense.thirdPartyFreight) || 0;
            breakdown.seguro += Number(expense.seguro) || 0;
            breakdown.loadingUnloading += expense.loadingUnloading || 0; breakdown.fines += expense.fines || 0; breakdown.others += expense.others || 0;
        }
        return breakdown;
    }, [filteredExpenses]);

    const driverPerformance = useMemo(() => {
        const performanceData: { [key: string]: { freight: number, expenses: number, km: number, tripCount: number } } = {};

        for (const driver of drivers) {
            performanceData[driver.id] = { freight: 0, expenses: 0, km: 0, tripCount: 0 };
        }

        for (const expense of filteredExpenses) {
            if (performanceData[expense.driverId]) {
                // FIX: Ensure all values are treated as numbers to prevent type errors.
                performanceData[expense.driverId].freight += Number(expense.freightValue) || 0;
                performanceData[expense.driverId].expenses += tripCosts(expense);
                performanceData[expense.driverId].km += (Number(expense.exitOdometer) || 0) - (Number(expense.entryOdometer) || 0);
                performanceData[expense.driverId].tripCount++;
            }
        }
        
        const dataToShow = Object.entries(performanceData);

        const finalPerformanceData = dataToShow
            .map(([driverId, data]) => ({
                driverId,
                driverName: driverMap.get(driverId) || 'Desconhecido',
                ...data,
                netResult: data.freight - data.expenses,
            }))
            .filter(d => d.tripCount > 0)
            .sort((a, b) => b.netResult - a.netResult);

        if (!driverSearchTerm) {
            return finalPerformanceData;
        }

        return finalPerformanceData.filter(d =>
            d.driverName.toLowerCase().includes(driverSearchTerm.toLowerCase())
        );
    }, [filteredExpenses, drivers, driverMap, driverSearchTerm]);
    
    const monthlyPerformance = useMemo(() => {
        const monthlyData: { [key: string]: { freight: number, expenses: number, netResult: number } } = {};
        
        filteredExpenses.forEach(expense => {
            if (!expense.date || !/^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
                return;
            }
            const monthKey = expense.date.substring(0, 7); // YYYY-MM
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { freight: 0, expenses: 0, netResult: 0 };
            }
            // FIX: Ensure all values are treated as numbers for correct calculation.
            const totalTripExpenses = tripCosts(expense);
            monthlyData[monthKey].freight += Number(expense.freightValue) || 0;
            monthlyData[monthKey].expenses += totalTripExpenses;
            monthlyData[monthKey].netResult += (Number(expense.freightValue) || 0) - totalTripExpenses;
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [filteredExpenses]);
    
    const formatMonth = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    const expenseLabels: { [key: string]: string } = {
        fueling: 'Abastecimento',
        toll: 'Pedágio',
        driverExpenses: 'Despesas Motorista',
        thirdPartyFreight: 'Frete Terceiro',
        seguro: 'Seguro', loadingUnloading: 'Carga e descarga', fines: 'Multas', others: 'Outros custos',
    };
    
    const chartData = useMemo(() => {
        return Object.entries(expenseBreakdown)
            .map(([key, value]) => ({
                name: expenseLabels[key as keyof typeof expenseLabels],
                value: value,
            }))
            .filter(item => item.value > 0); // Only show categories with expenses
    }, [expenseBreakdown]);
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
        // Fix: The 'percent' property from the charting library can be of an unknown type. It's explicitly converted to a number to ensure the comparison operation is safe.
        if (Number(percent) * 100 < 5) return null;
    
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                {`${(Number(percent) * 100).toFixed(0)}%`}
            </text>
        );
    };
    
    const handleExportPdf = async () => {
      setIsGeneratingPdf(true);
      try {
        const pdf = await expenseReport('Análise de viagens', filteredExpenses, drivers, 'Dados conforme os filtros da análise');
        await downloadFile(new Uint8Array(pdf.output('arraybuffer')), 'analise-viagens.pdf');
      } catch (error) { window.alert('Não foi possível gerar o relatório. Tente novamente.'); }
      finally { setIsGeneratingPdf(false); }
    };

    const PrintableContent = () => (
      <>
        <div className="print-header mb-8">
            <h1 className="text-3xl font-bold text-center">Relatório Avançado de Desempenho</h1>
            <h2 className="text-xl text-center text-gray-600 mt-2">
                {selectedDriverId === 'all' ? 'Consolidado - Todos os Motoristas' : `Motorista: ${driverMap.get(selectedDriverId)}`}
            </h2>
            {(startDate || endDate) && (
                <p className="text-center text-gray-500 mt-1 text-base">
                    Período: {startDate ? new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Início'} até {endDate ? new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Fim'}
                </p>
             )}
             <p className="text-center text-sm text-gray-500 mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6 print-summary">
            <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Faturamento Total</p>
                <p className="text-xl font-bold">{formatCurrency(overallStats.totalFreight)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Despesas Totais</p>
                <p className="text-xl font-bold">{formatCurrency(overallStats.totalExpenses)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg col-span-2">
                <p className="text-sm text-green-800">Resultado Líquido Total</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(overallStats.netResult)}</p>
            </div>
        </div>

        
        <div className="mb-8 page-break-before">
            <h3 className="text-2xl font-semibold mb-3 print-section-title">Desempenho por Motorista</h3>
            <table className="w-full text-left print-table">
                <thead>
                    <tr><th>Motorista</th><th className="text-right">Resultado Líquido</th><th className="text-right">Faturamento</th><th className="text-right">Viagens</th></tr>
                </thead>
                <tbody>
                    {driverPerformance.map(d => (
                        <tr key={d.driverId}>
                            <td>{d.driverName}</td>
                            <td className={`font-bold text-right currency ${d.netResult >= 0 ? 'text-brand-700' : 'text-orange-700'}`}>{formatCurrency(d.netResult)}</td>
                            <td className="text-right currency">{formatCurrency(d.freight)}</td>
                            <td className="text-right">{d.tripCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="mb-8 page-break-before">
            <h3 className="text-2xl font-semibold mb-3 print-section-title">Análise de Despesas</h3>
             {Object.entries(expenseBreakdown).map(([key, value]) => {
                const percentage = overallStats.totalExpenses > 0 ? (value / overallStats.totalExpenses) * 100 : 0;
                return (
                    <div key={key} className="flex justify-between items-center mb-2 text-sm p-2 border-b">
                        <span className="font-medium text-gray-700">{expenseLabels[key as keyof typeof expenseLabels]}</span>
                        <span className="font-bold">{formatCurrency(value)} ({isNaN(percentage) ? '0' : percentage.toFixed(1)}%)</span>
                    </div>
                );
            })}
        </div>

        <div className="page-break-before">
             <h3 className="text-2xl font-semibold mb-3 print-section-title">Desempenho Mensal</h3>
             <table className="w-full text-left print-table">
                <thead>
                    <tr><th>Mês/Ano</th><th className="text-right">Faturamento</th><th className="text-right">Despesas</th><th className="text-right">Resultado Líquido</th></tr>
                </thead>
                <tbody>
                    {monthlyPerformance.map(item => (
                        <tr key={item.month}>
                            <td className="capitalize">{formatMonth(item.month)}</td>
                            <td className="text-right currency">{formatCurrency(item.freight)}</td>
                            <td className="text-right currency">{formatCurrency(item.expenses)}</td>
                            <td className={`font-bold text-right currency ${item.netResult >= 0 ? 'text-brand-700' : 'text-orange-700'}`}>{formatCurrency(item.netResult)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </>
    );

    return (
        <div className="space-y-8">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-full sm:w-auto min-w-[250px]">
                        <label htmlFor="driver-filter-reports" className="block text-sm font-medium text-gray-700 mb-1">Motorista:</label>
                        <SearchableSelect
                            options={driverOptionsForFilter}
                            value={selectedDriverId}
                            onChange={setSelectedDriverId}
                        />
                    </div>
                     <div className="flex items-end gap-2">
                        <div>
                            <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">Data Início:</label>
                            <input
                                type="date"
                                id="start-date-filter"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                             <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">Data Fim:</label>
                            <input
                                type="date"
                                id="end-date-filter"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleExportPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                    <DocumentDownloadIcon className="h-5 w-5 mr-2" />
                    {isGeneratingPdf ? 'Gerando PDF...' : 'Exportar para PDF'}
                </button>
            </div>
            
             {/* Printable area - hidden from view but used for PDF generation */}
            <div id="printableArea" className="print-only absolute -left-full top-0 w-[800px] bg-white p-8 text-black">
                <PrintableContent />
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Faturamento Total" value={formatCurrency(overallStats.totalFreight)} icon={<TrendingUpIcon />} subtext="Soma de todos os fretes" />
                <StatCard title="Despesas Totais" value={formatCurrency(overallStats.totalExpenses)} icon={<TrendingDownIcon />} subtext="Soma de todos os custos" />
                <StatCard title="Resultado Líquido Total" value={formatCurrency(overallStats.netResult)} icon={<ScaleIcon />} subtext="Lucro/Prejuízo geral" />
                <StatCard title="Distância Total Percorrida" value={`${overallStats.totalKm.toLocaleString('pt-BR')} km`} icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />} subtext="Soma de todos os trechos" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Driver Performance */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Desempenho por Motorista</h2>
                     <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Pesquisar funcionário na tabela..."
                            value={driverSearchTerm}
                            onChange={(e) => setDriverSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-gray-600">Motorista</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600 text-right">Resultado Líquido</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600 text-right">Faturamento</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600 text-right">Viagens</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {driverPerformance.map(driver => (
                                    <tr key={driver.driverId} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-700">{driver.driverName}</td>
                                        <td className={`p-3 font-bold text-right ${driver.netResult >= 0 ? 'text-brand-600' : 'text-orange-600'}`}>
                                            {formatCurrency(driver.netResult)}
                                        </td>
                                        <td className="p-3 text-green-600 text-right">{formatCurrency(driver.freight)}</td>
                                        <td className="p-3 text-gray-600 text-right">{driver.tripCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         {driverPerformance.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                Nenhum funcionário encontrado para os filtros selecionados.
                            </div>
                        )}
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Análise de Despesas</h2>
                     {chartData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center min-h-[350px]">
                            <div className="h-64 w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                {chartData.map((item, index) => {
                                    const percentage = overallStats.totalExpenses > 0 ? (item.value / overallStats.totalExpenses) * 100 : 0;
                                    return (
                                        <div key={item.name} className="flex items-center text-sm">
                                            <span style={{ backgroundColor: COLORS[index % COLORS.length] }} className="block w-3 h-3 rounded-full mr-2 flex-shrink-0"></span>
                                            <span className="font-medium text-gray-700 flex-1 truncate" title={item.name}>{item.name}</span>
                                            <span className="font-bold text-gray-800 ml-2">{formatCurrency(item.value)}</span>
                                            <span className="text-gray-500 w-16 text-right font-mono">{isNaN(percentage) ? '0.0' : percentage.toFixed(1)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[350px] text-center text-gray-500">
                           Nenhuma despesa registrada para o filtro selecionado.
                        </div>
                    )}
                </div>
            </div>

             {/* Monthly Performance */}
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Desempenho Mensal</h2>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600">Mês/Ano</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-right">Faturamento</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-right">Despesas</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-right">Resultado Líquido</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {monthlyPerformance.map(item => (
                                <tr key={item.month} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-700 capitalize">{formatMonth(item.month)}</td>
                                    <td className="p-3 text-green-600 text-right">{formatCurrency(item.freight)}</td>
                                    <td className="p-3 text-red-600 text-right">{formatCurrency(item.expenses)}</td>
                                    <td className={`p-3 font-bold text-right ${item.netResult >= 0 ? 'text-brand-600' : 'text-orange-600'}`}>
                                        {formatCurrency(item.netResult)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {monthlyPerformance.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            Nenhum dado mensal encontrado para os filtros selecionados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedReports;
