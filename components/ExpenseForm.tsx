import React, { useState, useEffect } from 'react';
import { Driver, Expense } from '../types';
import SearchableSelect from './SearchableSelect';

interface ExpenseFormProps {
  formType: 'internal' | 'external';
  drivers: Driver[];
  onSubmit: (expense: Omit<Expense, 'id' | 'type'> & { id?: string }) => void;
  onCancel: () => void;
  initialData?: Expense | null;
}

const InputField: React.FC<{label: string, id: string, type?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean}> = ({ label, id, type = 'text', value, onChange, required = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            step={type === 'number' ? '0.01' : undefined}
        />
    </div>
);

const ExpenseForm: React.FC<ExpenseFormProps> = ({ formType, drivers, onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    driverId: drivers[0]?.id || '',
    freightValue: '',
    licensePlate: '',
    destination: '',
    clientName: '',
    thirdPartyFreight: '',
    seguro: '',
    invoice: '',
    fueling: '',
    entryOdometer: '',
    exitOdometer: '',
    driverExpenses: '',
    toll: '',
    loadingUnloading: '',
    fines: '',
    others: '',
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing && initialData) {
        setFormData({
            date: initialData.date,
            driverId: initialData.driverId,
            freightValue: String(initialData.freightValue),
            licensePlate: initialData.licensePlate,
            destination: initialData.destination,
            clientName: initialData.clientName || '',
            thirdPartyFreight: String(initialData.thirdPartyFreight),
            seguro: String(initialData.seguro),
            invoice: initialData.invoice,
            fueling: String(initialData.fueling),
            entryOdometer: String(initialData.entryOdometer),
            exitOdometer: String(initialData.exitOdometer),
            driverExpenses: String(initialData.driverExpenses),
            toll: String(initialData.toll),
            loadingUnloading: String(initialData.loadingUnloading || 0),
            fines: String(initialData.fines || 0),
            others: String(initialData.others || 0),
        });
    }
  }, [initialData, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDriverChange = (driverId: string) => {
    setFormData(prev => ({ ...prev, driverId: driverId }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newExpense: Omit<Expense, 'id' | 'type'> & { id?: string } = {
      date: formData.date,
      driverId: formData.driverId,
      licensePlate: formData.licensePlate,
      destination: formData.destination,
      clientName: formData.clientName,
      invoice: formData.invoice,
      freightValue: parseFloat(formData.freightValue) || 0,
      thirdPartyFreight: parseFloat(formData.thirdPartyFreight) || 0,
      seguro: parseFloat(formData.seguro) || 0,
      fueling: parseFloat(formData.fueling) || 0,
      entryOdometer: parseInt(formData.entryOdometer) || 0,
      exitOdometer: parseInt(formData.exitOdometer) || 0,
      driverExpenses: parseFloat(formData.driverExpenses) || 0,
      toll: parseFloat(formData.toll) || 0,
      loadingUnloading: parseFloat(formData.loadingUnloading) || 0,
      fines: parseFloat(formData.fines) || 0,
      others: parseFloat(formData.others) || 0,
    };
    onSubmit(newExpense);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
        {isEditing ? 'Editar' : 'Adicionar'} Despesa de Frete {formType === 'internal' ? 'Interno' : 'Externo'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField label="Data" id="date" type="date" value={formData.date} onChange={handleChange} required />
            <div>
                 <label htmlFor="driverId" className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
                 <SearchableSelect
                    options={drivers}
                    value={formData.driverId}
                    onChange={handleDriverChange}
                    placeholder="Selecione um motorista"
                  />
            </div>
            <InputField label="Placa" id="licensePlate" value={formData.licensePlate} onChange={handleChange} required />
            <InputField label="Localização (Origem - Destino)" id="destination" value={formData.destination} onChange={handleChange} required />
            <InputField label="Cliente / Mercadoria" id="clientName" value={formData.clientName || ''} onChange={handleChange} />
            <InputField label="Nota Fiscal (NF)" id="invoice" value={formData.invoice} onChange={handleChange} />
            <InputField label="Valor do Frete (R$)" id="freightValue" type="number" value={formData.freightValue} onChange={handleChange} required />
            <InputField label="Frete Terceiro (R$)" id="thirdPartyFreight" type="number" value={formData.thirdPartyFreight} onChange={handleChange} />
            <InputField label="Seguro (R$)" id="seguro" type="number" value={formData.seguro} onChange={handleChange} />
            <InputField label="Abastecimento (R$)" id="fueling" type="number" value={formData.fueling} onChange={handleChange} />
            <InputField label="Pedágio (R$)" id="toll" type="number" value={formData.toll} onChange={handleChange} />
            <InputField label="Despesas Motorista (R$)" id="driverExpenses" type="number" value={formData.driverExpenses} onChange={handleChange} />
            <InputField label="Km de Entrada" id="entryOdometer" type="number" value={formData.entryOdometer} onChange={handleChange} />
            <InputField label="Km de Saída" id="exitOdometer" type="number" value={formData.exitOdometer} onChange={handleChange} />
            <InputField label="Carga/Descarga (R$)" id="loadingUnloading" type="number" value={formData.loadingUnloading} onChange={handleChange} />
            <InputField label="Multas (R$)" id="fines" type="number" value={formData.fines} onChange={handleChange} />
            <InputField label="Outras Despesas (R$)" id="others" type="number" value={formData.others} onChange={handleChange} />
        </div>
        <div className="pt-6 border-t flex justify-end space-x-3">
             <button type="button" onClick={onCancel} className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">
                Cancelar
             </button>
             <button type="submit" className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105">
                {isEditing ? 'Salvar Alterações' : 'Salvar Despesa'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;