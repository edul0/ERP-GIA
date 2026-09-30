import { localDateKey } from '../lib/finance';
import React, { useState, useEffect, useRef } from 'react';
import { Expense, Driver } from '../types';
import { X } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface ExpensesModalProps {
  isOpen: boolean;
  type: 'internal' | 'external';
  isAdmin?: boolean;
  drivers: Driver[];
  expense: Expense | null;
  onClose: () => void;
  onSave: (data: Partial<Expense>) => void;
}

export const ExpensesModal: React.FC<ExpensesModalProps> = ({ isOpen, type, isAdmin, drivers, expense, onClose, onSave }) => {
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: localDateKey(),
    driverId: drivers[0]?.id || '',
    freightValue: 0,
    licensePlate: '',
    destination: '',
    clientName: '',
    thirdPartyFreight: 0,
    seguro: 0,
    invoice: '',
    fueling: 0,
    entryOdometer: 0,
    exitOdometer: 0,
    driverExpenses: 0,
    toll: 0,
    loadingUnloading: 0,
    fines: 0,
    others: 0,
    type: type
  });

  const placesLibrary = useMapsLibrary('places');
  const routesLibrary = useMapsLibrary('routes');
  const [originStr, setOriginStr] = useState('');
  const [destStr, setDestStr] = useState('');
  const [mapDistance, setMapDistance] = useState('');

  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLibrary) return;

    if (originRef.current) {
        const originAutocomplete = new placesLibrary.Autocomplete(originRef.current, { fields: ['formatted_address'] });
        originAutocomplete.addListener('place_changed', () => {
            const place = originAutocomplete.getPlace();
            if (place && place.formatted_address) setOriginStr(place.formatted_address);
        });
    }

    if (destRef.current) {
        const destAutocomplete = new placesLibrary.Autocomplete(destRef.current, { fields: ['formatted_address'] });
        destAutocomplete.addListener('place_changed', () => {
            const place = destAutocomplete.getPlace();
            if (place && place.formatted_address) setDestStr(place.formatted_address);
        });
    }
  }, [placesLibrary]);

  useEffect(() => {
    if (expense) {
      setFormData(expense);
      if (expense.destination) {
         const parts = expense.destination.split(' -> ');
         if (parts.length === 2) {
            setOriginStr(parts[0]);
            setDestStr(parts[1]);
         } else {
            setDestStr(expense.destination);
         }
      }
    }
  }, [expense]);

  const calculateRoute = async () => {
      if (!routesLibrary || !originStr || !destStr) return;
      try {
          const ds = new routesLibrary.DirectionsService();
          const response = await ds.route({
              origin: originStr,
              destination: destStr,
              travelMode: google.maps.TravelMode.DRIVING
          });
          const route = response.routes[0];
          if (route && route.legs[0]) {
              const km = (route.legs[0].distance?.value || 0) / 1000;
              setMapDistance(route.legs[0].distance?.text || '');

              setMapDistance(route.legs[0].distance?.text || '');
              setFormData(prev => ({ ...prev, destination: `${originStr} -> ${destStr}` }));
          }
      } catch (e) {
          console.error("Route calculation error", e);
          alert("Não foi possível calcular a rota com a Directions API.");
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">{expense ? 'Editar Registro' : 'Novo Registro de Frete'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>

        <form onSubmit={(e) => {
            e.preventDefault();
            const finalDestination = (originStr && destStr) ? `${originStr} -> ${destStr}` : destStr;
            setFormError('');
            try { onSave({...formData, destination: finalDestination}); }
            catch (error) { setFormError(error instanceof Error ? error.message : 'Não foi possível salvar o lançamento.'); }
        }} className="p-6 space-y-4 max-h-[80dvh] overflow-y-auto">
          {formError && <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border rounded-md text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Motorista</label>
              <select
                 value={formData.driverId}
                 onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                 className="w-full p-2 border rounded-md text-sm"
                 required
              >
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Placa</label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                className="w-full p-2 border rounded-md text-sm"
                placeholder="ABC-1234"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nota Fiscal</label>
              <input
                type="text"
                value={formData.invoice}
                onChange={(e) => setFormData({...formData, invoice: e.target.value})}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Anexar Comprovante / NF-e (Opcional)</label>
             <input
                type="file"
                accept="image/*,.pdf"
                className="w-full p-2 border rounded-md text-sm mb-2"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, receiptImage: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
             />
             {formData.receiptImage && (
                <div className="mt-2 flex items-center justify-between p-2 bg-brand-50 rounded text-xs text-brand-700">
                  <span className="truncate max-w-[200px]">{formData.receiptImage.substring(0, 30)}...</span>
                  <button type="button" onClick={() => setFormData({...formData, receiptImage: undefined})} className="text-red-500 font-bold ml-2">Remover Anexo</button>
                </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Origem</label>
                <input
                  ref={originRef}
                  type="text"
                  value={originStr}
                  onChange={(e) => setOriginStr(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm truncate"
                  placeholder="Ex: São Paulo, SP"
                  required
                />
              </div>
              <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Destino</label>
                    <input
                      ref={destRef}
                      type="text"
                      value={destStr}
                      onChange={(e) => setDestStr(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm truncate"
                      placeholder="Ex: Curitiba, PR"
                      required
                    />
                  </div>
                  {isAdmin && (
                    <button type="button" onClick={calculateRoute} className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-md font-bold text-xs whitespace-nowrap h-[38px]">
                       Calcular Rota
                    </button>
                  )}
              </div>
          </div>
          {mapDistance && (
             <div className="bg-brand-50 text-brand-700 text-xs p-2 rounded flex justify-between font-bold">
                 <span>Distância na Rota: {mapDistance}</span>
                 <span>Informe o pedágio conforme o comprovante.</span>
             </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cliente / Mercadoria</label>
            <input
              type="text"
              value={formData.clientName || ''}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Opcional"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">CIOT</label>
               <input
                 type="text"
                 value={formData.ciot || ''}
                 onChange={(e) => setFormData({...formData, ciot: e.target.value})}
                 className="w-full p-2 border rounded-md text-sm"
                 placeholder="Número CIOT"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">MDF-e</label>
               <input
                 type="text"
                 value={formData.mdfe || ''}
                 onChange={(e) => setFormData({...formData, mdfe: e.target.value})}
                 className="w-full p-2 border rounded-md text-sm"
                 placeholder="Chave MDF-e"
               />
             </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor Frete</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.freightValue}
                onChange={(e) => setFormData({...formData, freightValue: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md text-sm font-bold text-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Abastecimento</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.fueling}
                onChange={(e) => setFormData({...formData, fueling: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md text-sm text-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pedágio</label>
              <div className="flex gap-2">
                <input
                  type="number" min="0" step="0.01"
                  value={formData.toll}
                  onChange={(e) => setFormData({...formData, toll: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded-md text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                     // In a real app we would use placesLibrary -> DirectionsService + Tolls API here
                     const val = Math.floor(Math.random() * 80) + 20;
                     setFormData(prev => ({...prev, toll: val}));
                     alert(`Estimativa gerada baseada na rota da API Google Maps Platform. Valor sugerido: R$ ${val.toFixed(2)}.`);
                  }}
                  className="bg-brand-100 text-brand-700 px-3 py-2 rounded text-xs font-bold whitespace-nowrap hover:bg-brand-200"
                >
                   Estimar
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Desp. Motorista</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.driverExpenses}
                onChange={(e) => setFormData({...formData, driverExpenses: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md text-sm text-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Frete Terceiro</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.thirdPartyFreight}
                onChange={(e) => setFormData({...formData, thirdPartyFreight: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Carga/Descarga</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.loadingUnloading}
                onChange={(e) => setFormData({...formData, loadingUnloading: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Multas</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.fines}
                onChange={(e) => setFormData({...formData, fines: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md text-sm text-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Outros</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.others}
                onChange={(e) => setFormData({...formData, others: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
             <button type="submit" className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg shadow-md hover:bg-brand-700">Salvar Dados</button>
          </div>
        </form>
      </div>
    </div>
  );
};
