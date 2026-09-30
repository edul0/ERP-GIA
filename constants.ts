import { Driver, Expense, User, DriverTracking, Truck, MaintenanceRecord } from './types';

export const DUMMY_TRACKING: DriverTracking[] = [
  {
    driverId: 'd1',
    driverName: 'Egidio Sérgio',
    lastUpdate: new Date().toISOString(),
    currentLocation: { lat: -23.5505, lng: -46.6333, timestamp: new Date().toISOString(), speed: 65 },
    routeHistory: [
      { lat: -23.5489, lng: -46.6388, timestamp: new Date(Date.now() - 3600000).toISOString(), speed: 40 },
      { lat: -23.5505, lng: -46.6333, timestamp: new Date().toISOString(), speed: 65 },
    ],
    pendingCargos: [
      { id: 'c1', description: 'Peças Automotivas', destination: 'Campinas - SP', lat: -22.9056, lng: -47.0608, priority: 'high', deadline: 'Hoje, 18:00', value: 15000 },
      { id: 'c2', description: 'Alimentos Perecíveis', destination: 'Jundiaí - SP', lat: -23.1857, lng: -46.8978, priority: 'medium', deadline: 'Amanhã, 08:00', value: 5000 }
    ]
  },
  {
    driverId: 'd2',
    driverName: 'Dair José',
    lastUpdate: new Date().toISOString(),
    currentLocation: { lat: -22.9068, lng: -43.1729, timestamp: new Date().toISOString(), speed: 80 },
    routeHistory: [
      { lat: -22.9519, lng: -43.2105, timestamp: new Date(Date.now() - 7200000).toISOString(), speed: 0 },
      { lat: -22.9068, lng: -43.1729, timestamp: new Date().toISOString(), speed: 80 },
    ],
    pendingCargos: [
      { id: 'c3', description: 'Eletrônicos', destination: 'Niterói - RJ', lat: -22.8858, lng: -43.1153, priority: 'high', deadline: 'Hoje, 16:00', value: 45000 },
      { id: 'c4', description: 'Material de Construção', destination: 'Petrópolis - RJ', lat: -22.5112, lng: -43.1779, priority: 'low', deadline: '2 dias', value: 12000 }
    ]
  },
  {
    driverId: 'd3',
    driverName: 'Paulo Rogério',
    lastUpdate: new Date().toISOString(),
    currentLocation: { lat: -19.9173, lng: -43.9345, timestamp: new Date().toISOString(), speed: 0 },
    routeHistory: [
      { lat: -19.9200, lng: -43.9400, timestamp: new Date(Date.now() - 1800000).toISOString(), speed: 20 },
      { lat: -19.9173, lng: -43.9345, timestamp: new Date().toISOString(), speed: 0 },
    ],
    pendingCargos: [
      { id: 'c5', description: 'Grãos', destination: 'Betim - MG', lat: -19.9678, lng: -44.2001, priority: 'medium', deadline: 'Amanhã, 12:00', value: 8000 }
    ]
  }
];

export const DUMMY_TRUCKS: Truck[] = [
  { id: 't1', plate: 'ABC-1234', model: 'Scania R450', year: 2021, status: 'active', lastOdometer: 125000 },
  { id: 't2', plate: 'DEF-5678', model: 'Volvo FH 540', year: 2022, status: 'active', lastOdometer: 85000 },
  { id: 't3', plate: 'GHI-9012', model: 'Mercedes-Benz Actros', year: 2020, status: 'maintenance', lastOdometer: 210000 },
];

export const DUMMY_MAINTENANCE: MaintenanceRecord[] = [
  { id: 'm1', truckId: 't1', date: '2025-04-10', type: 'oil', description: 'Troca de Óleo e Filtros', cost: 1200, odometer: 120000, status: 'completed' },
  { id: 'm2', truckId: 't3', date: '2025-04-25', type: 'preventive', description: 'Revisão de Freios', cost: 3500, odometer: 210000, status: 'pending' },
  { id: 'm3', truckId: 't2', date: '2025-03-15', type: 'tire', description: 'Troca de 2 pneus dianteiros', cost: 4800, odometer: 75000, status: 'completed' },
];

export const DUMMY_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Egidio Sérgio' },
  { id: 'd2', name: 'Dair José' },
  { id: 'd3', name: 'Paulo Rogério' },
  { id: 'd4', name: 'Adenilson Ferreira' },
  { id: 'd5', name: 'Hugo Oliveira' },
  { id: 'd6', name: 'Anderson (salsicha)' },
  { id: 'd7', name: 'Jose Celio' },
  { id: 'd8', name: 'Emerson Werneck' },
  { id: 'd9', name: 'Edson Pedroso' },
  { id: 'd10', name: 'Lucas Michalowicz' },
  { id: 'd11', name: 'Luiz Cláudio' },
];

export const DUMMY_USERS: User[] = [
  { id: 'u1', username: 'admin', password: 'admin', role: 'admin' },
  { id: 'u2', username: 'joao', password: '123', role: 'user' },
];


const monthMap: { [key: string]: string } = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 
    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08', 
    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
};

const parseDate = (dateStr: string): string => {
    const parts = dateStr.split('/');
    if (parts.length !== 2) return `2024-01-01`;
    const [day, monthAbbr] = parts;
    const month = monthMap[monthAbbr.toLowerCase()];
    if (!month) return `2024-01-01`;
    const year = new Date().getFullYear();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const DUMMY_EXPENSES: Expense[] = [
    {
        id: 'int1', date: parseDate('11/abr'), driverId: 'd1', freightValue: 1435.00,
        licensePlate: 'GFB5D14', destination: 'Refricon', invoice: '1973',
        thirdPartyFreight: 0, seguro: 15.00, fueling: 150.00, entryOdometer: 120500, exitOdometer: 120750,
        driverExpenses: 50.00, toll: 25.50,
        loadingUnloading: 0, fines: 0, others: 0,
        type: 'internal'
    },
    {
        id: 'int2', date: parseDate('11/abr'), driverId: 'd1', freightValue: 0,
        licensePlate: 'HQG2C88', destination: 'Luis/GIA', invoice: '11034',
        thirdPartyFreight: 622.00, seguro: 5.00, fueling: 200.00, entryOdometer: 465000, exitOdometer: 465200,
        driverExpenses: 30.00, toll: 0,
        loadingUnloading: 0, fines: 0, others: 0,
        type: 'internal'
    },
    {
        id: 'int3', date: parseDate('11/abr'), driverId: 'd2', freightValue: 0,
        licensePlate: 'GET0I46', destination: 'Luis/GIA', invoice: '11035',
        thirdPartyFreight: 0, seguro: 5.00, fueling: 278, entryOdometer: 465201, exitOdometer: 465356,
        driverExpenses: 20.00, toll: 15.20, type: 'internal'
    },
    {
        id: 'int4', date: parseDate('14/abr'), driverId: 'd3', freightValue: 507.00,
        licensePlate: 'FLV4I43', destination: 'Luis/GIA', invoice: '11036',
        thirdPartyFreight: 0, seguro: 5.00, fueling: 100.00, entryOdometer: 897000, exitOdometer: 897150,
        driverExpenses: 15.00, toll: 10.00, type: 'internal'
    },
    {
        id: 'int5', date: parseDate('14/abr'), driverId: 'd1', freightValue: 0,
        licensePlate: 'HQG2C88', destination: 'ZE/GIA', invoice: '11037',
        thirdPartyFreight: 728.00, seguro: 7.00, fueling: 250.00, entryOdometer: 465201, exitOdometer: 465300,
        driverExpenses: 40.00, toll: 0, type: 'internal'
    },
    {
        id: 'int6', date: parseDate('15/abr'), driverId: 'd1', freightValue: 1350.00,
        licensePlate: 'GFB5D14', destination: 'Refricon', invoice: '1975',
        thirdPartyFreight: 0, seguro: 13.50, fueling: 180.00, entryOdometer: 120751, exitOdometer: 121000,
        driverExpenses: 55.00, toll: 28.70, type: 'internal'
    },
    {
        id: 'int7', date: parseDate('15/abr'), driverId: 'd2', freightValue: 8640.00,
        licensePlate: 'GET0I46', destination: 'Benassi RJ', invoice: '1976',
        thirdPartyFreight: 0, seguro: 86.40, fueling: 340.58, entryOdometer: 465357, exitOdometer: 465812,
        driverExpenses: 150.00, toll: 112.40, type: 'internal'
    },
    {
        id: 'int8', date: parseDate('19/abr'), driverId: 'd4', freightValue: 323.00,
        licensePlate: 'GFB5D14', destination: 'Luis/GIA', invoice: '11063',
        thirdPartyFreight: 0, seguro: 3.23, fueling: 80.00, entryOdometer: 121001, exitOdometer: 121100,
        driverExpenses: 10.00, toll: 5.00, type: 'internal'
    },
    {
        id: 'int9', date: parseDate('19/abr'), driverId: 'd4', freightValue: 700.00,
        licensePlate: 'FLV4I43', destination: 'Luis/GIA', invoice: '11064',
        thirdPartyFreight: 0, seguro: 7.00, fueling: 120.00, entryOdometer: 897151, exitOdometer: 897300,
        driverExpenses: 20.00, toll: 12.00, type: 'internal'
    },
    {
        id: 'int10', date: parseDate('21/abr'), driverId: 'd2', freightValue: 7080.00,
        licensePlate: 'GET0I46', destination: 'Benassi RJ', invoice: '1978',
        thirdPartyFreight: 0, seguro: 70.80, fueling: 84.20, entryOdometer: 465813, exitOdometer: 466250,
        driverExpenses: 160.00, toll: 115.80, type: 'internal'
    },
    {
        id: 'int11', date: parseDate('22/abr'), driverId: 'd1', freightValue: 363.00,
        licensePlate: 'HQG2C88', destination: 'Adilson/GIA', invoice: '11068',
        thirdPartyFreight: 0, seguro: 3.63, fueling: 90.00, entryOdometer: 465301, exitOdometer: 465400,
        driverExpenses: 15.00, toll: 0, type: 'internal'
    },
    {
        id: 'int12', date: parseDate('22/abr'), driverId: 'd1', freightValue: 624.00,
        licensePlate: 'HQG2C88', destination: 'Luis/GIA', invoice: '11069',
        thirdPartyFreight: 0, seguro: 6.24, fueling: 341.43, entryOdometer: 466608, exitOdometer: 467000,
        driverExpenses: 25.00, toll: 18.00, type: 'internal'
    },
    {
        id: 'int13', date: parseDate('23/abr'), driverId: 'd3', freightValue: 122.00,
        licensePlate: 'FLV4I43', destination: 'Luis/GIA', invoice: '2922',
        thirdPartyFreight: 0, seguro: 1.22, fueling: 50.00, entryOdometer: 897301, exitOdometer: 897380,
        driverExpenses: 10.00, toll: 0, type: 'internal'
    },
    {
        id: 'int14', date: parseDate('23/abr'), driverId: 'd3', freightValue: 320.00,
        licensePlate: 'FLV4I43', destination: 'Luis/GIA', invoice: '2923',
        thirdPartyFreight: 0, seguro: 3.20, fueling: 319.33, entryOdometer: 467477, exitOdometer: 467900,
        driverExpenses: 20.00, toll: 15.00, type: 'internal'
    },
    {
        id: 'int15', date: parseDate('24/abr'), driverId: 'd1', freightValue: 5600.00,
        licensePlate: 'FLV4I43', destination: 'MG/GIA', invoice: '1984',
        thirdPartyFreight: 0, seguro: 56.00, fueling: 950.00, entryOdometer: 897381, exitOdometer: 898176,
        driverExpenses: 200.00, toll: 180.00, type: 'internal'
    },
    {
        id: 'int16', date: parseDate('24/abr'), driverId: 'd2', freightValue: 6000.00,
        licensePlate: 'GET0I46', destination: 'MG/GIA', invoice: '1986',
        thirdPartyFreight: 0, seguro: 60.00, fueling: 1000.00, entryOdometer: 898177, exitOdometer: 899282,
        driverExpenses: 220.00, toll: 195.00, type: 'internal'
    },
    {
        id: 'int17', date: parseDate('28/abr'), driverId: 'd4', freightValue: 1000.00,
        licensePlate: 'GFB5D14', destination: 'Refricon', invoice: '2936',
        thirdPartyFreight: 0, seguro: 10.00, fueling: 343.40, entryOdometer: 899283, exitOdometer: 900165,
        driverExpenses: 80.00, toll: 45.00, type: 'internal'
    },
    {
        id: 'int18', date: parseDate('30/abr'), driverId: 'd7', freightValue: 4900.00,
        licensePlate: 'FLV4I43', destination: 'MG/GIA', invoice: '1998',
        thirdPartyFreight: 0, seguro: 49.00, fueling: 900.00, entryOdometer: 900166, exitOdometer: 901267,
        driverExpenses: 180.00, toll: 170.00, type: 'internal'
    },
    {
        id: 'int19', date: parseDate('01/mai'), driverId: 'd8', freightValue: 0,
        licensePlate: 'MKN4H77', destination: 'MG/GIA', invoice: '1999',
        thirdPartyFreight: 4921.00, seguro: 49.21, fueling: 1100.00, entryOdometer: 50000, exitOdometer: 50900,
        driverExpenses: 250.00, toll: 200.00, type: 'internal'
    },
    {
        id: 'int20', date: parseDate('02/mai'), driverId: 'd2', freightValue: 5243.00,
        licensePlate: 'GET0I46', destination: 'MG/GIA', invoice: '2004',
        thirdPartyFreight: 0, seguro: 52.43, fueling: 980.00, entryOdometer: 901268, exitOdometer: 902373,
        driverExpenses: 190.00, toll: 175.00, type: 'internal'
    },
     {
        id: 'int21', date: parseDate('06/mai'), driverId: 'd3', freightValue: 5880.00,
        licensePlate: 'MJA3A27', destination: 'Benassi RJ', invoice: '2016',
        thirdPartyFreight: 0, seguro: 58.80, fueling: 364.02, entryOdometer: 129815, exitOdometer: 130250,
        driverExpenses: 140.00, toll: 105.00, type: 'internal'
    },
    {
        id: 'int22', date: parseDate('08/mai'), driverId: 'd3', freightValue: 6430.00,
        licensePlate: 'MJA3A27', destination: 'Benassi RJ', invoice: '2021',
        thirdPartyFreight: 0, seguro: 64.30, fueling: 340.0, entryOdometer: 902374, exitOdometer: 902800,
        driverExpenses: 155.00, toll: 110.00, type: 'internal'
    },
    {
        id: 'int23', date: parseDate('10/mai'), driverId: 'd2', freightValue: 4494.00,
        licensePlate: 'GET0I46', destination: 'MG/GIA', invoice: '2025',
        thirdPartyFreight: 0, seguro: 44.94, fueling: 900.00, entryOdometer: 902801, exitOdometer: 903700,
        driverExpenses: 180.00, toll: 160.00, type: 'internal'
    },
    {
        id: 'int24', date: parseDate('12/mai'), driverId: 'd3', freightValue: 8640.00,
        licensePlate: 'MJA3A27', destination: 'Benassi RJ', invoice: '2029',
        thirdPartyFreight: 0, seguro: 86.40, fueling: 450.00, entryOdometer: 130251, exitOdometer: 130700,
        driverExpenses: 180.00, toll: 125.00, type: 'internal'
    },
    {
        id: 'int25', date: parseDate('15/mai'), driverId: 'd1', freightValue: 0,
        licensePlate: 'HQG2C88', destination: 'Luis/GIA', invoice: '11328',
        thirdPartyFreight: 728.00, seguro: 7.28, fueling: 358.60, entryOdometer: 905652, exitOdometer: 906000,
        driverExpenses: 45.00, toll: 22.00, type: 'internal'
    },
    {
        id: 'int26', date: parseDate('22/mai'), driverId: 'd3', freightValue: 8640.00,
        licensePlate: 'MJA3A27', destination: 'Benassi RJ', invoice: '11426',
        thirdPartyFreight: 0, seguro: 86.40, fueling: 480.00, entryOdometer: 130701, exitOdometer: 131150,
        driverExpenses: 190.00, toll: 130.00, type: 'internal'
    },
    {
        id: 'int27', date: parseDate('24/mai'), driverId: 'd3', freightValue: 3745.00,
        licensePlate: 'MJA3A27', destination: 'SP Benassi', invoice: '11447',
        thirdPartyFreight: 0, seguro: 37.45, fueling: 475.0, entryOdometer: 908171, exitOdometer: 908900,
        driverExpenses: 100.00, toll: 90.00, type: 'internal'
    },
    {
        id: 'int28', date: parseDate('26/mai'), driverId: 'd3', freightValue: 7680.00,
        licensePlate: 'MJA3A27', destination: 'Benassi RJ', invoice: '2076',
        thirdPartyFreight: 0, seguro: 76.80, fueling: 460.00, entryOdometer: 131151, exitOdometer: 131600,
        driverExpenses: 170.00, toll: 120.00, type: 'internal'
    },
    {
        id: 'int29', date: parseDate('05/jun'), driverId: 'd4', freightValue: 3640.00,
        licensePlate: 'GFB5D14', destination: 'Benassi RJ', invoice: '2095',
        thirdPartyFreight: 0, seguro: 36.40, fueling: 446.18, entryOdometer: 134621, exitOdometer: 135050,
        driverExpenses: 120.00, toll: 95.00, type: 'internal'
    },
    {
        id: 'int30', date: parseDate('09/jun'), driverId: 'd2', freightValue: 7600.00,
        licensePlate: 'GET0I46', destination: 'Benassi RJ', invoice: '11564',
        thirdPartyFreight: 0, seguro: 76.00, fueling: 340.29, entryOdometer: 477100, exitOdometer: 477540,
        driverExpenses: 165.00, toll: 118.00, type: 'internal'
    },
    {
        id: 'int31', date: parseDate('12/jun'), driverId: 'd3', freightValue: 6600.00,
        licensePlate: 'MJA3A27', destination: 'Benassi RJ', invoice: '11588',
        thirdPartyFreight: 0, seguro: 66.00, fueling: 420.00, entryOdometer: 131601, exitOdometer: 132040,
        driverExpenses: 160.00, toll: 115.00, type: 'internal'
    },
    {
        id: 'int32', date: parseDate('13/jun'), driverId: 'd2', freightValue: 0,
        licensePlate: 'GFB5D14', destination: 'ZE/GIA', invoice: '11594',
        thirdPartyFreight: 567.00, seguro: 5.67, fueling: 467.54, entryOdometer: 136375, exitOdometer: 136600,
        driverExpenses: 60.00, toll: 30.00, type: 'internal'
    },
    // Dados para Motoristas Externos
    {
        id: 'ext1',
        date: parseDate('15/mai'),
        driverId: 'd5', // Hugo Oliveira
        freightValue: 3500.00,
        licensePlate: 'ABC1D23',
        destination: 'Cliente Externo SP',
        thirdPartyFreight: 1500.00,
        seguro: 35.00,
        invoice: 'EXT-001',
        fueling: 500.00,
        entryOdometer: 100000,
        exitOdometer: 101500,
        driverExpenses: 200.00,
        toll: 50.00,
        type: 'external'
    },
    {
        id: 'ext2',
        date: parseDate('20/mai'),
        driverId: 'd6', // Anderson (salsicha)
        freightValue: 4200.00,
        licensePlate: 'XYZ9F87',
        destination: 'Cliente Externo RJ',
        thirdPartyFreight: 2000.00,
        seguro: 42.00,
        invoice: 'EXT-002',
        fueling: 700.00,
        entryOdometer: 250000,
        exitOdometer: 252000,
        driverExpenses: 300.00,
        toll: 80.00,
        type: 'external'
    },
    {
        id: 'ext3',
        date: parseDate('01/jun'),
        driverId: 'd5', // Hugo Oliveira again
        freightValue: 2800.00,
        licensePlate: 'ABC1D23',
        destination: 'Cliente Externo MG',
        thirdPartyFreight: 1000.00,
        seguro: 28.00,
        invoice: 'EXT-003',
        fueling: 400.00,
        entryOdometer: 102000,
        exitOdometer: 103200,
        driverExpenses: 150.00,
        toll: 40.00,
        type: 'external'
    },
    {
        id: 'ext4',
        date: parseDate('10/jun'),
        driverId: 'd1', // Egidio Sérgio, que também tem fretes internos
        freightValue: 5500.00,
        licensePlate: 'EXT4R56',
        destination: 'Agregado Sul',
        thirdPartyFreight: 3000.00,
        seguro: 55.00,
        invoice: 'EXT-004',
        fueling: 1200.00,
        entryOdometer: 50000,
        exitOdometer: 52500,
        driverExpenses: 400.00,
        toll: 120.00,
        type: 'external'
    }
];