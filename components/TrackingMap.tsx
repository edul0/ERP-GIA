import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { DriverTracking, Cargo, Expense } from '../types';
import { TruckIcon } from './icons/TruckIcon';
import { BotIcon } from './icons/BotIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { Navigation, X, Map as MapIcon, ChevronRight, CheckCircle, Plus } from 'lucide-react';

interface TrackingMapProps {
  trackingData: DriverTracking[];
  onCompleteCargo?: (driverId: string, cargoId: string) => void;
  expenses?: Expense[];
  onLinkExpense?: (driverId: string, expense: Expense) => void;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ trackingData, onCompleteCargo, expenses = [], onLinkExpense }) => {
  const [selectedDriver, setSelectedDriver] = useState<DriverTracking | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 }); // Default SP
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [infoWindowDriverId, setInfoWindowDriverId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDriver) {
      const updatedDriver = trackingData.find(d => d.driverId === selectedDriver.driverId);
      if (updatedDriver) {
        setSelectedDriver(updatedDriver);
      }
    }
  }, [trackingData]);

  const handleSelectDriver = (driver: DriverTracking) => {
    setSelectedDriver(driver);
    setMapCenter({ lat: driver.currentLocation.lat, lng: driver.currentLocation.lng });
    setInfoWindowDriverId(driver.driverId);
  };

  return (
    <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm overflow-hidden relative animate-in fade-in">
      <div className="p-3 md:p-4 border-bottom bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center border-b gap-3 z-10 relative">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           <MapIcon className="text-brand-600" /> Monitoramento GPS
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          {selectedDriver && (
              <button
                  onClick={() => { setSelectedDriver(null); setShowSidebarOnMobile(true); setInfoWindowDriverId(null); }}
                  className="bg-white border text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 flex-1 md:flex-none justify-center flex items-center gap-1"
              >
                  <X size={16} /> Limpar Seleção
              </button>
          )}
          <button
            className="md:hidden bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex-1 justify-center"
            onClick={() => setShowSidebarOnMobile(!showSidebarOnMobile)}
          >
            {showSidebarOnMobile ? 'Ver Mapa' : 'Ver Motoristas'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Active Drivers */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r flex flex-col h-full absolute md:relative z-10 transition-transform ${showSidebarOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b bg-gray-50 flex flex-col items-center">
              <BotIcon className="w-12 h-12 text-brand-500 mb-2" />
              <p className="text-sm text-center text-gray-700 font-medium">As posições são atualizadas em tempo real através do app dos motoristas.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {trackingData.map(driver => (
                  <div
                      key={driver.driverId}
                      onClick={() => handleSelectDriver(driver)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                          selectedDriver?.driverId === driver.driverId
                          ? 'border-brand-500 bg-brand-50/50 shadow-md transform scale-[1.02]'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                  >
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${driver.currentLocation.speed > 0 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                              <span className="font-bold text-gray-900">{driver.driverName}</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3 pt-3 border-t">
                          <div>
                              <span className="block text-gray-400 mb-0.5">Velocidade</span>
                              <span className="font-bold text-gray-800">{driver.currentLocation.speed} km/h</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          {selectedDriver && selectedDriver.pendingCargos.length > 0 && (
              <div className="p-4 border-t bg-gray-50 max-h-[50%] overflow-y-auto custom-scrollbar">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
                     <span>Cargas Pendentes</span>
                     <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{selectedDriver.pendingCargos.length}</span>
                  </h4>
                  <div className="space-y-3">
                      {selectedDriver.pendingCargos.map(cargo => (
                          <div key={cargo.id} className="bg-white p-3 rounded-lg border shadow-sm text-sm">
                              <div className="flex justify-between items-start mb-2">
                                  <strong className="text-gray-900 block truncate pr-2" title={cargo.description}>{cargo.description}</strong>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap ${
                                      cargo.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                      {cargo.priority}
                                  </span>
                              </div>
                              <div className="text-gray-500 flex justify-between">
                                  <span className="truncate pr-2">📍 {cargo.destination}</span>
                                  <span className="text-brand-600 whitespace-nowrap">R$ {cargo.value.toLocaleString()}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t flex gap-2">
                                  <button onClick={() => {
                                      const wazeUrl = `https://waze.com/ul?ll=${cargo.lat},${cargo.lng}&navigate=yes`;
                                      window.open(wazeUrl, '_blank');
                                  }} className="flex-1 bg-green-100 text-green-700 py-1.5 rounded flex items-center justify-center gap-1 font-bold transition hover:bg-green-200">
                                      <Navigation size={12} /> Waze
                                  </button>
                                  <button onClick={() => {
                                      if (onCompleteCargo) {
                                        onCompleteCargo(selectedDriver.driverId, cargo.id);
                                        setMapCenter({ lat: cargo.lat, lng: cargo.lng });
                                      }
                                  }} className="flex-1 bg-brand-100 text-brand-700 py-1.5 rounded flex items-center justify-center gap-1 font-bold transition hover:bg-brand-200">
                                      <CheckCircle size={12} /> Concluir
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
                  {onLinkExpense && expenses.filter(e => e.driverId === selectedDriver.driverId && !selectedDriver.pendingCargos.some(c => c.id === e.id)).length > 0 && (
                      <button
                         onClick={() => setIsLinkModalOpen(true)}
                         className="w-full mt-3 py-2 bg-brand-50 border border-brand-200 text-brand-700 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-brand-100 transition"
                      >
                         <Plus size={16} /> Vincular Carga
                      </button>
                  )}
              </div>
          )}
        </div>

        {/* Map Container */}
        <div className={`flex-1 relative ${showSidebarOnMobile ? 'hidden md:block' : 'block'}`}>
          <Map
            defaultCenter={mapCenter}
            center={mapCenter}
            defaultZoom={8}
            mapId="b96317d7b1aa28ac"
            disableDefaultUI={true}
            className="w-full h-full"
          >
            {trackingData.map((driver) => {
              const isSelected = selectedDriver?.driverId === driver.driverId;

              return (
                <React.Fragment key={driver.driverId}>
                  <AdvancedMarker
                     position={{ lat: driver.currentLocation.lat, lng: driver.currentLocation.lng }}
                     onClick={() => {
                         handleSelectDriver(driver);
                     }}
                  >
                     <div className="bg-brand-600 text-white p-2 rounded-full shadow-lg border-2 border-white cursor-pointer hover:bg-brand-700 transition">
                        <TruckIcon className="w-5 h-5" />
                     </div>
                  </AdvancedMarker>

                  {infoWindowDriverId === driver.driverId && (
                     <InfoWindow
                        position={{ lat: driver.currentLocation.lat, lng: driver.currentLocation.lng }}
                        onCloseClick={() => setInfoWindowDriverId(null)}
                        pixelOffset={[0, -30]}
                     >
                        <div className="p-1 min-w-[150px] text-gray-800">
                          <strong className="block text-lg border-b pb-1 mb-1">{driver.driverName}</strong>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                              <div>
                                  <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Velocidade</span>
                                  <span className="font-bold text-brand-600">{driver.currentLocation.speed} km/h</span>
                              </div>
                              <div>
                                  <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Sinal</span>
                                  <span>{new Date(driver.lastUpdate).toLocaleTimeString()}</span>
                              </div>
                          </div>
                        </div>
                     </InfoWindow>
                  )}

                  {/* Cargo locations (only if selected) */}
                  {isSelected && driver.pendingCargos.map((cargo, idx) => (
                      <AdvancedMarker key={cargo.id} position={{ lat: cargo.lat, lng: cargo.lng }}>
                          <div className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white ${cargo.priority === 'high' ? 'bg-red-500' : (cargo.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-500')}`}>
                             {idx + 1}
                          </div>
                      </AdvancedMarker>
                  ))}
                </React.Fragment>
              );
            })}
          </Map>

          {/* Legend overlay */}
          <div className="absolute top-4 right-4 z-10 bg-white/90 p-3 rounded-lg shadow-lg border border-gray-100 text-xs hidden md:block backdrop-blur-sm">
            <div className="flex flex-col gap-2 font-medium">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-600 rounded-full shadow-sm"></div>
                    <span className="text-gray-700">Caminhões</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-700">Alta Prioridade</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-700">Média Prioridade</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Link Cargo Modal */}
      {isLinkModalOpen && selectedDriver && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95 z-[1000]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Vincular Carga</h3>
                    <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>
                <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-4">Selecione uma despesa/viagem para gerar uma carga no mapa para este motorista.</p>
                    {expenses.filter(e => e.driverId === selectedDriver.driverId && !selectedDriver.pendingCargos.some(c => c.id === e.id)).map(e => (
                        <button
                           key={e.id}
                           onClick={() => {
                               if (onLinkExpense) onLinkExpense(selectedDriver.driverId, e);
                               setIsLinkModalOpen(false);
                           }}
                           className="w-full text-left p-4 border rounded-lg hover:border-brand-500 hover:bg-brand-50 transition"
                        >
                            <div className="font-bold text-gray-800 mb-1">{e.destination}</div>
                            <div className="text-sm text-gray-500">Valor: R$ {e.freightValue.toLocaleString()} • Data: {e.date}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
