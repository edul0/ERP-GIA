export interface SaleLine { id: string; species: string; quantity: number; unitPrice: number; }
export interface SaleSheet {
  totalBoxes?: number;
  brokenBoxes?: number;
  saleNumber: string; company: string; city: string; state: string;
  paymentTerms: string; farm: string; invoiceValue: number;
  products: SaleLine[]; discounts: SaleLine[];
  driverCity: string; driverState: string; freightPerBox: number;
  insuranceIncluded: boolean; notes: string;
}
export interface Attachment { id: string; name: string; path: string; mimeType: string; size: number; }
export interface Expense {
  id: string;
  date: string;
  driverId: string;
  freightValue: number;
  licensePlate: string;
  destination: string;
  clientName?: string;
  thirdPartyFreight: number;
  seguro: number;
  invoice: string;
  fueling: number;
  entryOdometer: number;
  exitOdometer: number;
  driverExpenses: number;
  toll: number;
  loadingUnloading?: number;
  fines?: number;
  others?: number;
  type: 'internal' | 'external';
  receiptImage?: string; // Anexo do Comprovante (Base64)
  ciot?: string; // Geração de CIOT
  mdfe?: string; // Geração de MDF-e
  saleSheet?: SaleSheet;
  attachments?: Attachment[];
}

export interface Driver {
  id: string;
  name: string;
}

export type Role = 'admin' | 'user' | 'mechanic' | 'finance' | 'viewer';

export interface User {
  id: string;
  username: string;
  password?: string; // Used only by isolated demonstration accounts; cloud authentication uses Firebase Auth.
  role: Role;
  profilePicture?: string;
}

export type View = 'dashboard' | 'motorista-interno' | 'motorista-externo' | 'user-management' | 'driver-management' | 'advanced-reports' | 'tracking' | 'maintenance' | 'fleet' | 'dre';

export interface MaintenanceRecord {
  id: string;
  truckId: string;
  date: string;
  type: 'preventive' | 'corrective' | 'tire' | 'oil';
  description: string;
  cost: number;
  odometer: number;
  status: 'pending' | 'completed';
}

export interface Truck {
  id: string;
  plate: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'idle';
  lastOdometer: number;
  nextMaintenanceOdometer?: number; // Controle de Manutenção Preventiva
}

export interface LocationRecord {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
}

export interface Cargo {
  id: string;
  description: string;
  destination: string;
  lat: number;
  lng: number;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  value: number;
}

export interface DriverTracking {
  driverId: string;
  driverName: string;
  lastUpdate: string;
  currentLocation: LocationRecord;
  routeHistory: LocationRecord[];
  pendingCargos: Cargo[];
}
