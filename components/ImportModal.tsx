import { parseCSV, parseMoney } from '../lib/csv';
import { localDateKey } from '../lib/finance';
import React, { useRef, useState } from 'react';
import { X, Upload, FileDown, AlertTriangle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  type: 'internal' | 'external';
  onClose: () => void;
  onImport: (data: any[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, type }) => {
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const rows = parseCSV(await file.text());
      if (rows.length < 2) throw new Error('O CSV não contém lançamentos.');
      const data = rows.slice(1).map((columns, index) => {
        if (columns.length !== 14) throw new Error('Linha ' + (index + 2) + ': use as 14 colunas do modelo.');
        return {
          type, date: columns[0].trim(), driverId: columns[1].trim(), licensePlate: columns[2].trim(),
          destination: columns[3].trim(), freightValue: parseMoney(columns[4]), fueling: parseMoney(columns[5]),
          driverExpenses: parseMoney(columns[6]), toll: parseMoney(columns[7]), invoice: columns[8],
          thirdPartyFreight: parseMoney(columns[9]), seguro: parseMoney(columns[10]), loadingUnloading: parseMoney(columns[11]),
          fines: parseMoney(columns[12]), others: parseMoney(columns[13]), entryOdometer: 0, exitOdometer: 0
        };
      });
      onImport(data); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível importar o CSV.'); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const downloadTemplate = () => {
    const header = "Data;ID_Motorista;Placa;Origem_Destino;Valor_Frete;Abastecimento;Desp_Motorista;Pedagio;NF;Frete_Terceiro;Seguro;Carga_Descarga;Multas;Outros\n";
    const example = localDateKey() + ";d1;ABC-1234;SP - RJ;5000;1200;150;80;12345;0;15;0;0;0";
    const blob = new Blob([header + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_erp.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">Importar Planilha CSV</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700 text-sm">{error}</p>}
          <div className="bg-brand-50 p-4 rounded-lg flex gap-3 border border-brand-100">
             <AlertTriangle className="text-brand-600 flex-shrink-0" />
             <div className="text-sm text-brand-800">
                <p className="font-bold mb-1">Dica de Importação</p>
                <p>Certifique-se que o arquivo está no formato UTF-8 e utilize o ponto e vírgula (;) como separador.</p>
             </div>
          </div>

          <div className="space-y-4">
            <button 
              className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-full group-hover:bg-brand-100 transition">
                  <Upload className="text-gray-500 group-hover:text-brand-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Selecionar arquivo CSV</p>
                  <p className="text-xs text-gray-500 font-medium">Arraste ou clique para buscar</p>
                </div>
              </div>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />

            <button 
              onClick={downloadTemplate}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition border border-gray-200"
            >
              <FileDown size={20} className="text-gray-500" />
              <span>Baixar Modelo de Planilha</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-100">Fechar</button>
        </div>
      </div>
    </div>
  );
};
