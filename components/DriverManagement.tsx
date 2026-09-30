import React, { useState, useMemo } from 'react';
import { Driver } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TruckIcon } from './icons/TruckIcon';
import ConfirmationModal from './ConfirmationModal';

interface DriverManagementProps {
    drivers: Driver[];
    onAddDriver: (name: string) => void;
    onDeleteDriver: (driverId: string) => void;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, onAddDriver, onDeleteDriver }) => {
    const [driverName, setDriverName] = useState('');
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (driverName.trim() === '') {
            alert('Por favor, insira o nome do motorista.');
            return;
        }
        onAddDriver(driverName);
        setDriverName('');
    };

    const handleConfirmDelete = () => {
        if (driverToDelete) {
            onDeleteDriver(driverToDelete.id);
            setDriverToDelete(null);
        }
    };
    
    const filteredDrivers = useMemo(() => {
        if (!searchTerm) {
            return drivers;
        }
        return drivers.filter(driver =>
            driver.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [drivers, searchTerm]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Add Driver Form */}
                <div className="bg-white p-8 rounded-lg shadow-md h-fit">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                        Adicionar Novo Motorista
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="new-drivername" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <input
                                id="new-drivername"
                                type="text"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                                placeholder="Ex: João da Silva"
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button type="submit" className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                               <PlusCircleIcon className="h-5 w-5 mr-2" />
                               Adicionar Motorista
                            </button>
                        </div>
                    </form>
                </div>
                {/* Driver List */}
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                        Motoristas Cadastrados
                    </h2>
                    <div className="mb-4">
                        <label htmlFor="driver-search" className="sr-only">Pesquisar Motorista</label>
                        <input
                            id="driver-search"
                            type="text"
                            placeholder="Pesquisar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {filteredDrivers.length > 0 ? filteredDrivers.map(driver => (
                            <div key={driver.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border group">
                               <div className="flex items-center">
                                 <TruckIcon className="h-5 w-5 mr-3 text-gray-500" />
                                 <span className="font-medium text-gray-700">{driver.name}</span>
                               </div>
                               <button 
                                 onClick={() => setDriverToDelete(driver)}
                                 className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                                 aria-label={`Excluir ${driver.name}`}
                               >
                                    <TrashIcon className="h-5 w-5" />
                               </button>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-4">Nenhum motorista encontrado.</p>
                        )}
                    </div>
                </div>
            </div>
            {driverToDelete && <ConfirmationModal
                isOpen={!!driverToDelete}
                title="Confirmar Exclusão"
                message={`Deseja excluir o motorista "${driverToDelete.name}"? A exclusão será bloqueada se houver fretes vinculados, para preservar o histórico.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDriverToDelete(null)}
            />}
        </>
    )
}

export default DriverManagement;
