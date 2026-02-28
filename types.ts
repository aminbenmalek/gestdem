
export enum OrderStatus {
  EN_COURS = 'En cours',
  EN_ATTENTE = 'En attente',
  VALIDE = 'Validé',
  ANNULE = 'Annulé'
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

export type ViewType = 'dashboard' | 'orders' | 'create' | 'suppliers' | 'catalog' | 'centres' | 'stock';
