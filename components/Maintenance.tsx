import { localDateKey, displayDate } from '../lib/finance';
import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, Truck } from '../types';
import { Wrench, Calendar, DollarSign, PenTool, CheckCircle, Clock, Pencil, Trash2, Filter, Download } from 'lucide-react';

interface MaintenanceProps {
  maintenance: MaintenanceRecord[];
  trucks: Truck[];
  onAddMaintenance: (record: Partial<MaintenanceRecord>) => void;
  onUpdateMaintenance?: (record: MaintenanceRecord) => void;
  onDeleteMaintenance?: (id: string) => void;
}

export const Maintenance: React.FC<MaintenanceProps> = ({ maintenance, trucks, onAddMaintenance, onUpdateMaintenance, onDeleteMaintenance }) => {
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    truckId: trucks[0]?.id || '',
    date: localDateKey(),
    type: 'preventive' as any,
    description: '',
    cost: '',
    odometer: '',
    status: 'pending' as any
  });

  const [filterTruck, setFilterTruck] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
    if (editingId && onUpdateMaintenance) {
      onUpdateMaintenance({
        id: editingId,
        ...formData,
        cost: parseFloat(formData.cost as string) || 0,
        odometer: parseInt(formData.odometer as string) || 0
      } as MaintenanceRecord);
    } else {
      onAddMaintenance({
        ...formData,
        cost: parseFloat(formData.cost as string) || 0,
        odometer: parseInt(formData.odometer as string) || 0
      });
    }
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Não foi possível salvar.'); return; }
    setShowForm(false);
    setEditingId(null);
    setFormData({
      truckId: trucks[0]?.id || '',
      date: localDateKey(),
      type: 'preventive',
      description: '',
      cost: '',
      odometer: '',
      status: 'pending'
    });
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setFormData({
      truckId: record.truckId,
      date: new Date(record.date).toISOString().split('T')[0],
      type: record.type as any,
      description: record.description,
      cost: record.cost.toString(),
      odometer: record.odometer.toString(),
      status: record.status as any
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de manutenção?')) {
      if (onDeleteMaintenance) {
        onDeleteMaintenance(id);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Concluído</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase">Pendente</span>;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tire': return <PenTool className="w-5 h-5 text-gray-500" />;
      case 'oil': return <DollarSign className="w-5 h-5 text-brand-500" />;
      case 'preventive': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'corrective': return <Wrench className="w-5 h-5 text-red-500" />;
      default: return <Wrench className="w-5 h-5 text-gray-500" />;
    }
  };

  const tipoTranslations: Record<string, string> = {
    preventive: 'Preventiva',
    corrective: 'Corretiva',
    tire: 'Pneus',
    oil: 'Troca de Óleo'
  };

  const years = useMemo(() => {
    const y = new Set(maintenance.map(m => new Date(m.date).getFullYear().toString()));
    return Array.from(y).sort((a, b) => b.localeCompare(a));
  }, [maintenance]);

  const filteredMaintenance = useMemo(() => {
    return maintenance.filter(m => {
      const matchTruck = filterTruck === 'all' || m.truckId === filterTruck;
      const matchType = filterType === 'all' || m.type === filterType;
      const matchYear = filterYear === 'all' || new Date(m.date).getFullYear().toString() === filterYear;
      return matchTruck && matchType && matchYear;
    });
  }, [maintenance, filterTruck, filterType, filterYear]);

  const exportToExcel = () => {
    const data = filteredMaintenance.map(m => {
      const truck = trucks.find(t => t.id === m.truckId);
      
      const tipoTraduzido = tipoTranslations[m.type] || m.type;

      const statusTraduzido = {
        'pending': 'Pendente',
        'in-progress': 'Em Andamento',
        'completed': 'Concluído'
      }[m.status] || m.status;

      return {
        'Equipamento': truck ? `${truck.plate} - ${truck.model}` : 'Desconhecido',
        'Data': new Date(m.date).toLocaleDateString('pt-BR'),
        'Tipo': tipoTraduzido,
        'Descrição': m.description,
        'Custo': m.cost.toString(),
        'Hodômetro (km)': m.odometer.toString(),
        'Status': statusTraduzido
      };
    });

    if (data.length === 0) return;

    // Build CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'), // Use semicolon for Excel compatibility in Brazil
      ...data.map(row => 
        headers.map(header => {
          const val = (row as any)[header] || '';
          // Escape quotes and wrap in quotes to handle commas/semicolons in values
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(';')
      )
    ].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'manutencao.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manutenção de Frota</h2>
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button 
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
              } else {
                setShowForm(true);
              }
            }}
            className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg shadow-md hover:bg-brand-700 transition"
          >
            {showForm ? 'Cancelar' : 'Nova Ordem de Serviço'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {trucks
          .filter(truck => filterTruck === 'all' || truck.id === filterTruck)
          .map(truck => {
          const totalCost = filteredMaintenance
            .filter(m => m.truckId === truck.id)
            .reduce((sum, m) => sum + m.cost, 0);
          return (
            <div key={truck.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">{truck.plate}</p>
                  <p className="text-sm font-medium text-gray-800">{truck.model}</p>
                </div>
                <Wrench size={16} className="text-gray-300" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">Total Gasto em Manutenção</p>
                <p className="text-lg font-bold text-brand-600">{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-brand-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300">
              {formError && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded">{formError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caminhão</label>
            <select 
              value={formData.truckId}
              onChange={e => setFormData({...formData, truckId: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input 
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
              className="w-full p-2 border rounded-md"
            >
              <option value="preventive">Preventiva</option>
              <option value="corrective">Corretiva</option>
              <option value="tire">Pneus</option>
              <option value="oil">Troca de Óleo</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input 
              type="text"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: Troca de lonas de freio traseiras"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
            <input 
              type="number" min="0"
              value={formData.cost}
              onChange={e => setFormData({...formData, cost: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hodômetro (km)</label>
            <input 
              type="number"
              value={formData.odometer}
              onChange={e => setFormData({...formData, odometer: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="lg:col-span-3 flex justify-end">
            <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">
              Salvar Ordem
            </button>
          </div>
        </form>
      )}

      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <Filter size={20} />
          <span>Filtros:</span>
        </div>
        <div className="flex flex-1 gap-4 flex-col md:flex-row w-full">
          <select 
            value={filterTruck} 
            onChange={(e) => setFilterTruck(e.target.value)}
            className="p-2 border rounded-md min-w-[200px]"
          >
            <option value="all">Todos os Equipamentos</option>
            {trucks.map(t => (
              <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>
            ))}
          </select>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">Todos os Tipos</option>
            <option value="preventive">Preventiva</option>
            <option value="corrective">Corretiva</option>
            <option value="tire">Pneus</option>
            <option value="oil">Troca de Óleo</option>
          </select>
          <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">Todos os Anos</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <table className="w-full text-left table-auto">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Equipamento</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Data</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Tipo</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Descrição</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Km</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Custo</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMaintenance.map(m => {
              const truck = trucks.find(t => t.id === m.truckId);
              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{truck?.plate || 'Desconhecido'}</td>
                  <td className="p-4 text-gray-600">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(m.type)}
                      <span className="capitalize">
                        {tipoTranslations[m.type] || m.type}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{m.description}</td>
                  <td className="p-4 text-gray-600">{m.odometer.toLocaleString()} km</td>
                  <td className="p-4 font-bold text-gray-800">{m.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-4">{getStatusBadge(m.status)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(m)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
