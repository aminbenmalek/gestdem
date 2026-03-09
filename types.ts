export enum OrderStatus {
  EN_COURS = "En cours",
  EN_ATTENTE = "En attente",
  VALIDE = "Validé",
  ANNULE = "Annulé",
}

export interface Centre {
  id: string;
  name: string;
  location: string;
  description?: string;
  history?: HistoryEntry[];
}

export interface HistoryEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  changes?: string;
}

export interface Product {
  id: string;
  code: string;
  label: string;
  defaultUnitPrice: number;
  defaultTaxRate: number;
  applyFodec: boolean;
  minStockLevel?: number;
  history?: HistoryEntry[];
}

export interface OrderItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  fodecRate: number;
  applyFodec: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  address: string;
  category: string;
  taxId?: string;
  phone?: string;
  history?: HistoryEntry[];
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  supplierId: string;
  centreId: string;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  totalHT: number;
  totalFodec: number;
  totalTVA: number;
  totalTTC: number;
}

export interface StockMovementItem {
  productId: string;
  label: string;
  quantity: number;
}

export interface StockMovement {
  id: string;
  reference: string;
  date: string;
  sourceCentreId: string;
  destinationCentreId: string;
  items: StockMovementItem[];
  notes?: string;
}
export interface Vehicle {
  id: string;
  registration: string;
  brand: string;
  model: string;
  year: number;
  fuelType: "Essence" | "Diesel" | "Hybride" | "Electrique";
  currentMileage: number;
  status: "Disponible" | "En service" | "En maintenance" | "Hors service";
  assignment?: string;
  driverId?: string;
  insuranceExpiry: string;
  lastMaintenanceDate: string;
  nextMaintenanceMileage: number;
  history?: HistoryEntry[];
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: "Vidange" | "Réparation" | "Révision" | "Pneumatiques" | "Autre";
  description: string;
  cost: number;
  mileageAtMaintenance: number;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  quantity: number;
  cost: number;
  mileageAtFueling: number;
  driver?: string;
  destination?: string;
  reason?: string;
  referenceNumber?: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: "Actif" | "Inactif";
  history?: HistoryEntry[];
}

export type ViewType =
  | "dashboard"
  | "orders"
  | "create"
  | "suppliers"
  | "catalog"
  | "centres"
  | "stock"
  | "fleet";
