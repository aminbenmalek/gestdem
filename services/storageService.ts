
import { Order, Supplier, Product, Centre, OrderStatus, StockMovement, StockMovementItem } from '../types';

const ORDERS_KEY = 'gestionpro_orders_v2';
const SUPPLIERS_KEY = 'gestionpro_suppliers';
const PRODUCTS_KEY = 'gestionpro_products';
const CENTRES_KEY = 'gestionpro_centres';
const STOCK_MOVEMENTS_KEY = 'gestionpro_stock_movements';

const defaultSuppliers: Supplier[] = [
  { id: 's1', name: 'SOTETEL', email: 'contact@sotetel.tn', address: 'Tunis, Tunisie', category: 'Télécom', taxId: '0012345/A/M/000', phone: '+216 71 000 000' },
  { id: 's2', name: 'Ulysse Informatique', email: 'info@ulysse.tn', address: 'Ariana, Tunisie', category: 'Informatique', taxId: '9876543/B/N/000', phone: '+216 70 111 222' },
  { id: 's3', name: 'STAFIM', email: 'peugeot@stafim.com.tn', address: 'Tunis, Tunisie', category: 'Automobile', taxId: '1122334/C/P/000', phone: '+216 71 333 444' },
];

const defaultCentres: Centre[] = [
  { id: 'c1', name: 'Siège Social - Tunis', location: 'Tunis', description: 'Direction générale et administration' },
  { id: 'c2', name: 'Dépôt Central - Ben Arous', location: 'Ben Arous', description: 'Gestion de stock principal' },
  { id: 'c3', name: 'Agence Sousse', location: 'Sousse', description: 'Bureau régional Sahel' },
];

const defaultProducts: Product[] = [
  { id: 'p1', code: 'LAP-001', label: 'Ordinateur Portable Dell Latitude', defaultUnitPrice: 2450.000, defaultTaxRate: 19, applyFodec: true, minStockLevel: 5 },
  { id: 'p2', code: 'PRN-002', label: 'Imprimante HP LaserJet', defaultUnitPrice: 850.000, defaultTaxRate: 19, applyFodec: true, minStockLevel: 3 },
  { id: 'p3', code: 'PPR-003', label: 'Ramette Papier A4', defaultUnitPrice: 14.500, defaultTaxRate: 19, applyFodec: false, minStockLevel: 50 },
  { id: 'p4', code: 'MOU-004', label: 'Souris Sans Fil', defaultUnitPrice: 45.000, defaultTaxRate: 19, applyFodec: true, minStockLevel: 10 },
];

export const storageService = {
  getOrders: (): Order[] => {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    const orders = storageService.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    const previousOrder = index >= 0 ? orders[index] : null;
    const updatedOrders = [...orders];

    if (index >= 0) {
      updatedOrders[index] = order;
    } else {
      updatedOrders.push(order);
    }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

    // Déclenchement automatique du restockage si passage à l'état VALIDE
    if (order.status === OrderStatus.VALIDE && (!previousOrder || previousOrder.status !== OrderStatus.VALIDE)) {
      const movements = storageService.getStockMovements();
      const alreadyLogged = movements.some(m => m.reference === `IN-${order.orderNumber}`);
      
      if (!alreadyLogged) {
        const mvtItems: StockMovementItem[] = order.items.map(item => ({
          productId: item.productId,
          label: item.description,
          quantity: item.quantity
        }));

        const supplier = storageService.getSuppliers().find(s => s.id === order.supplierId);

        const inflowMovement: StockMovement = {
          id: `mvt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          reference: `IN-${order.orderNumber}`,
          date: new Date().toISOString().split('T')[0],
          sourceCentreId: `SUPPLIER:${order.supplierId}`,
          destinationCentreId: order.centreId,
          items: mvtItems,
          notes: `Validation BC ${order.orderNumber} (${supplier?.name || 'Fournisseur'})`
        };
        
        storageService.saveStockMovement(inflowMovement);

        // Update supplier history
        const suppliers = storageService.getSuppliers();
        const sIndex = suppliers.findIndex(s => s.id === order.supplierId);
        if (sIndex >= 0) {
          const supplier = suppliers[sIndex];
          const historyEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleString('fr-FR'),
            user: 'Système',
            action: 'Validation Bon de Commande',
            changes: `Bon de commande ${order.orderNumber} validé. Montant: ${order.totalTTC.toFixed(3)} TND`
          };
          
          const updatedSupplier = {
            ...supplier,
            history: [...(supplier.history || []), historyEntry]
          };
          
          // Save the updated supplier
          storageService.saveSupplier(updatedSupplier);
        }

        // Update centre history
        const centres = storageService.getCentres();
        const cIndex = centres.findIndex(c => c.id === order.centreId);
        if (cIndex >= 0) {
          const centre = centres[cIndex];
          const historyEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleString('fr-FR'),
            user: 'Système',
            action: 'Réception Stock',
            changes: `Réception BC ${order.orderNumber}. Montant: ${order.totalTTC.toFixed(3)} TND`
          };
          
          const updatedCentre = {
            ...centre,
            history: [...(centre.history || []), historyEntry]
          };
          
          storageService.saveCentre(updatedCentre);
        }
      }
    }
  },
  deleteOrder: (id: string) => {
    const orders = storageService.getOrders();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.filter(o => o.id !== id)));
  },
  getSuppliers: (): Supplier[] => {
    const data = localStorage.getItem(SUPPLIERS_KEY);
    return data ? JSON.parse(data) : defaultSuppliers;
  },
  saveSupplier: (supplier: Supplier) => {
    const suppliers = storageService.getSuppliers();
    const index = suppliers.findIndex(s => s.id === supplier.id);
    const updatedSuppliers = [...suppliers];
    if (index >= 0) updatedSuppliers[index] = supplier;
    else updatedSuppliers.push(supplier);
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(updatedSuppliers));
  },
  deleteSupplier: (id: string) => {
    const suppliers = storageService.getSuppliers();
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers.filter(s => s.id !== id)));
  },
  getCentres: (): Centre[] => {
    const data = localStorage.getItem(CENTRES_KEY);
    return data ? JSON.parse(data) : defaultCentres;
  },
  saveCentre: (centre: Centre) => {
    const centres = storageService.getCentres();
    const index = centres.findIndex(c => c.id === centre.id);
    const updatedCentres = [...centres];
    if (index >= 0) updatedCentres[index] = centre;
    else updatedCentres.push(centre);
    localStorage.setItem(CENTRES_KEY, JSON.stringify(updatedCentres));
  },
  deleteCentre: (id: string) => {
    const centres = storageService.getCentres();
    localStorage.setItem(CENTRES_KEY, JSON.stringify(centres.filter(c => c.id !== id)));
  },
  getProducts: (): Product[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : defaultProducts;
  },
  saveProduct: (product: Product) => {
    const products = storageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    const updatedProducts = [...products];
    if (index >= 0) updatedProducts[index] = product;
    else updatedProducts.push(product);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
  },
  deleteProduct: (id: string) => {
    const products = storageService.getProducts();
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products.filter(p => p.id !== id)));
  },
  getStockMovements: (): StockMovement[] => {
    const data = localStorage.getItem(STOCK_MOVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveStockMovement: (mvt: StockMovement) => {
    const movements = storageService.getStockMovements();
    movements.push(mvt);
    localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(movements));
  },
  deleteStockMovement: (id: string) => {
    const movements = storageService.getStockMovements();
    localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(movements.filter(m => m.id !== id)));
  },
  getProductStock: (productId: string, centreId: string, movements?: StockMovement[]): number => {
    const mvts = movements || storageService.getStockMovements();
    let balance = 0;
    mvts.forEach(m => {
      m.items.forEach(item => {
        if (item.productId === productId) {
          if (m.destinationCentreId === centreId) balance += item.quantity;
          if (m.sourceCentreId === centreId) balance -= item.quantity;
        }
      });
    });
    return balance;
  },
  getNextOrderNumber: (): string => {
    const orders = storageService.getOrders();
    const currentYear = new Date().getFullYear();
    
    const yearOrders = orders.filter(o => {
      const parts = o.orderNumber.split('/');
      return parts.length === 2 && parts[1] === currentYear.toString();
    });
    
    if (yearOrders.length === 0) {
      return `1/${currentYear}`;
    }
    
    const numbers = yearOrders.map(o => parseInt(o.orderNumber.split('/')[0])).filter(n => !isNaN(n));
    const nextNumber = Math.max(...numbers, 0) + 1;
    
    return `${nextNumber}/${currentYear}`;
  }
};

export const formatCurrency = (val: number) => {
  return val.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' TND';
};
