import React from 'react';
import { Expense, Driver } from '../types';
import { X, Printer, Download } from 'lucide-react';

interface DanfeModalProps {
  expense: Expense;
  driverName?: string;
  onClose: () => void;
}

export const DanfeModal: React.FC<DanfeModalProps> = ({ expense, driverName, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm px-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col my-8 relative">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">Visualização de DANFE / CTe</h3>
          <div className="flex gap-2">
              <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold rounded transition">
                  <Printer size={16} /> Imprimir
              </button>
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
          </div>
        </div>
        
        <div className="p-6 bg-gray-100/50">
            <div id="printableArea" className="bg-white border-2 border-gray-800 p-6 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible print:absolute print:left-0 print:top-0 print:w-full print:border-none print:shadow-none print:p-0">
                {/* Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-4 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold tracking-tight">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</h1>
                        <p className="text-sm">0 - ENTRADA | 1 - SAÍDA: <strong>1</strong></p>
                        <p className="text-sm">Nº: <strong>{expense.invoice || '000.000.000'}</strong> SÉRIE: 1</p>
                    </div>
                    <div className="flex-1 border-2 border-gray-800 p-2 text-center flex flex-col justify-center">
                        <div className="text-xs font-bold uppercase mb-1">Chave de Acesso</div>
                        <div className="font-mono text-sm tracking-widest">{Math.random().toString().slice(2, 6).padEnd(4, '0')} {Math.random().toString().slice(2, 6).padEnd(4, '0')} {Math.random().toString().slice(2, 6).padEnd(4, '0')} {Math.random().toString().slice(2, 6).padEnd(4, '0')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-gray-400 p-2 text-xs mb-4">
                    <div className="border-r border-gray-400 pr-2 block">
                        <span className="text-gray-500 uppercase block text-[10px]">Natureza da Operação</span>
                        <strong>PRESTAÇÃO DE SERVIÇO DE TRANSPORTE</strong>
                    </div>
                    <div className="border-r border-gray-400 px-2 block">
                        <span className="text-gray-500 uppercase block text-[10px]">Protocolo de Autorização</span>
                        <strong>{Math.floor(Math.random() * 1000000000)}</strong>
                    </div>
                    <div className="border-r border-gray-400 px-2 block">
                        <span className="text-gray-500 uppercase block text-[10px]">Placa do Veículo</span>
                        <strong>{expense.licensePlate}</strong>
                    </div>
                    <div className="pl-2 block">
                        <span className="text-gray-500 uppercase block text-[10px]">Localização (Origem - Destino)</span>
                        <strong>{expense.destination}</strong>
                    </div>
                </div>

                {/* Sender/Receiver */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                    <div className="border border-gray-400 p-2 rounded-sm relative mt-2 pt-3">
                        <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-500">Emitente</span>
                        <div className="font-bold">Operação Logística</div>
                        <div>CNPJ: 12.345.678/0001-90</div>
                        <div>ENDEREÇO: Rodovia Anhanguera, km 55, SP</div>
                    </div>
                    <div className="border border-gray-400 p-2 rounded-sm relative mt-2 pt-3">
                        <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-500">Transp. / Motorista</span>
                        <div className="font-bold">{driverName || 'EX-FROTA'}</div>
                        <div>RNTRC: {Math.floor(Math.random() * 10000000)}</div>
                    </div>
                </div>

                <div className="border border-gray-400 p-2 mb-4 text-xs font-mono grid grid-cols-2 gap-4">
                     <div>
                         <span className="text-gray-500 block">VALOR DO FRETE</span>
                         <span className="text-lg font-bold">R$ {expense.freightValue.toFixed(2)}</span>
                     </div>
                     <div>
                         <span className="text-gray-500 block">DATA DA EMISSÃO</span>
                         <span className="font-bold">{new Date(expense.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                     </div>
                </div>

                <div className="border-t-2 border-gray-800 pt-4 mt-6 text-center text-xs text-gray-500 print-bottom">
                    Este é um documento gerado pelo sistema ERP GIA.
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
