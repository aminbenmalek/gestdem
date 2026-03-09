import {
  Order,
  Supplier,
  Product,
  Centre,
  OrderStatus,
  StockMovement,
  StockMovementItem,
  Driver,
  FuelRecord,
  MaintenanceRecord,
  Vehicle,
} from "../types";
import { apiService } from "./apiService";

const ORDERS_KEY = "gestionpro_orders_v2";
const SUPPLIERS_KEY = "gestionpro_suppliers";
const PRODUCTS_KEY = "gestionpro_products";
const CENTRES_KEY = "gestionpro_centres";
const STOCK_MOVEMENTS_KEY = "gestionpro_stock_movements";
const VEHICLES_KEY = "gestionpro_vehicles";
const MAINTENANCE_KEY = "gestionpro_maintenance";
const FUEL_KEY = "gestionpro_fuel";
const DRIVERS_KEY = "gestionpro_drivers";

const defaultSuppliers: Supplier[] = [
  {
    id: "s1",
    name: "SOTETEL",
    email: "contact@sotetel.tn",
    address: "Tunis, Tunisie",
    category: "Télécom",
    taxId: "0012345/A/M/000",
    phone: "+216 71 000 000",
  },
  {
    id: "s2",
    name: "Ulysse Informatique",
    email: "info@ulysse.tn",
    address: "Ariana, Tunisie",
    category: "Informatique",
    taxId: "9876543/B/N/000",
    phone: "+216 70 111 222",
  },
  {
    id: "s3",
    name: "STAFIM",
    email: "peugeot@stafim.com.tn",
    address: "Tunis, Tunisie",
    category: "Automobile",
    taxId: "1122334/C/P/000",
    phone: "+216 71 333 444",
  },
];

const defaultCentres: Centre[] = [
  {
    id: "c1",
    name: "Siège Social - Tunis",
    location: "Tunis",
    description: "Direction générale et administration",
  },
  {
    id: "c2",
    name: "Dépôt Central - Ben Arous",
    location: "Ben Arous",
    description: "Gestion de stock principal",
  },
  {
    id: "c3",
    name: "Agence Sousse",
    location: "Sousse",
    description: "Bureau régional Sahel",
  },
];

const defaultProducts: Product[] = [
  {
    id: "p1",
    code: "LAP-001",
    label: "Ordinateur Portable Dell Latitude",
    defaultUnitPrice: 2450.0,
    defaultTaxRate: 19,
    applyFodec: true,
    minStockLevel: 5,
  },
  {
    id: "p2",
    code: "PRN-002",
    label: "Imprimante HP LaserJet",
    defaultUnitPrice: 850.0,
    defaultTaxRate: 19,
    applyFodec: true,
    minStockLevel: 3,
  },
  {
    id: "p3",
    code: "PPR-003",
    label: "Ramette Papier A4",
    defaultUnitPrice: 14.5,
    defaultTaxRate: 19,
    applyFodec: false,
    minStockLevel: 50,
  },
  {
    id: "p4",
    code: "MOU-004",
    label: "Souris Sans Fil",
    defaultUnitPrice: 45.0,
    defaultTaxRate: 19,
    applyFodec: true,
    minStockLevel: 10,
  },
];

export const storageService = {
  getOrders: (): Order[] => {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    const orders = storageService.getOrders();
    const index = orders.findIndex((o) => o.id === order.id);
    const previousOrder = index >= 0 ? orders[index] : null;
    const updatedOrders = [...orders];

    if (index >= 0) {
      updatedOrders[index] = order;
    } else {
      updatedOrders.push(order);
    }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

    // Fire-and-forget: persist order to backend
    (async () => {
      try {
        if (previousOrder) await apiService.put(`/orders/${order.id}`, order);
        else await apiService.post("/orders", order);
      } catch (err) {
        console.error("Failed to sync order to backend", err);
      }
    })();

    // Déclenchement automatique du restockage si passage à l'état VALIDE
    if (
      order.status === OrderStatus.VALIDE &&
      (!previousOrder || previousOrder.status !== OrderStatus.VALIDE)
    ) {
      const movements = storageService.getStockMovements();
      const alreadyLogged = movements.some(
        (m) => m.reference === `IN-${order.orderNumber}`,
      );

      if (!alreadyLogged) {
        const mvtItems: StockMovementItem[] = order.items.map((item) => ({
          productId: item.productId,
          label: item.description,
          quantity: item.quantity,
        }));

        const supplier = storageService
          .getSuppliers()
          .find((s) => s.id === order.supplierId);

        const inflowMovement: StockMovement = {
          id: `mvt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          reference: `IN-${order.orderNumber}`,
          date: new Date().toISOString().split("T")[0],
          sourceCentreId: `SUPPLIER:${order.supplierId}`,
          destinationCentreId: order.centreId,
          items: mvtItems,
          notes: `Validation BC ${order.orderNumber} (${supplier?.name || "Fournisseur"})`,
        };

        storageService.saveStockMovement(inflowMovement);

        // Update supplier history
        const suppliers = storageService.getSuppliers();
        const sIndex = suppliers.findIndex((s) => s.id === order.supplierId);
        if (sIndex >= 0) {
          const supplier = suppliers[sIndex];
          const historyEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleString("fr-FR"),
            user: "Système",
            action: "Validation Bon de Commande",
            changes: `Bon de commande ${order.orderNumber} validé. Montant: ${order.totalTTC.toFixed(3)} TND`,
          };

          const updatedSupplier = {
            ...supplier,
            history: [...(supplier.history || []), historyEntry],
          };

          // Save the updated supplier
          storageService.saveSupplier(updatedSupplier);
        }

        // Update centre history
        const centres = storageService.getCentres();
        const cIndex = centres.findIndex((c) => c.id === order.centreId);
        if (cIndex >= 0) {
          const centre = centres[cIndex];
          const historyEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleString("fr-FR"),
            user: "Système",
            action: "Réception Stock",
            changes: `Réception BC ${order.orderNumber}. Montant: ${order.totalTTC.toFixed(3)} TND`,
          };

          const updatedCentre = {
            ...centre,
            history: [...(centre.history || []), historyEntry],
          };

          storageService.saveCentre(updatedCentre);
        }
      }
    }
  },
  deleteOrder: (id: string) => {
    const orders = storageService.getOrders();
    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify(orders.filter((o) => o.id !== id)),
    );
    (async () => {
      try {
        await apiService.delete(`/orders/${id}`);
      } catch (err) {
        console.error("Failed to delete order on backend", err);
      }
    })();
  },
  getSuppliers: (): Supplier[] => {
    const data = localStorage.getItem(SUPPLIERS_KEY);
    return data ? JSON.parse(data) : defaultSuppliers;
  },
  saveSupplier: (supplier: Supplier) => {
    const suppliers = storageService.getSuppliers();
    const index = suppliers.findIndex((s) => s.id === supplier.id);
    const updatedSuppliers = [...suppliers];
    if (index >= 0) updatedSuppliers[index] = supplier;
    else updatedSuppliers.push(supplier);
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(updatedSuppliers));
    (async () => {
      try {
        if (index >= 0)
          await apiService.put(`/suppliers/${supplier.id}`, supplier);
        else await apiService.post("/suppliers", supplier);
      } catch (err) {
        console.error("Failed to sync supplier to backend", err);
      }
    })();
  },
  deleteSupplier: (id: string) => {
    const suppliers = storageService.getSuppliers();
    localStorage.setItem(
      SUPPLIERS_KEY,
      JSON.stringify(suppliers.filter((s) => s.id !== id)),
    );
    (async () => {
      try {
        await apiService.delete(`/suppliers/${id}`);
      } catch (err) {
        console.error("Failed to delete supplier on backend", err);
      }
    })();
  },
  getCentres: (): Centre[] => {
    const data = localStorage.getItem(CENTRES_KEY);
    return data ? JSON.parse(data) : defaultCentres;
  },
  saveCentre: (centre: Centre) => {
    const centres = storageService.getCentres();
    const index = centres.findIndex((c) => c.id === centre.id);
    const updatedCentres = [...centres];
    if (index >= 0) updatedCentres[index] = centre;
    else updatedCentres.push(centre);
    localStorage.setItem(CENTRES_KEY, JSON.stringify(updatedCentres));
    (async () => {
      try {
        if (index >= 0) await apiService.put(`/centres/${centre.id}`, centre);
        else await apiService.post("/centres", centre);
      } catch (err) {
        console.error("Failed to sync centre to backend", err);
      }
    })();
  },
  deleteCentre: (id: string) => {
    const centres = storageService.getCentres();
    localStorage.setItem(
      CENTRES_KEY,
      JSON.stringify(centres.filter((c) => c.id !== id)),
    );
    (async () => {
      try {
        await apiService.delete(`/centres/${id}`);
      } catch (err) {
        console.error("Failed to delete centre on backend", err);
      }
    })();
  },
  getProducts: (): Product[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : defaultProducts;
  },
  saveProduct: (product: Product) => {
    const products = storageService.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    const updatedProducts = [...products];
    if (index >= 0) updatedProducts[index] = product;
    else updatedProducts.push(product);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    (async () => {
      try {
        if (index >= 0)
          await apiService.put(`/products/${product.id}`, product);
        else await apiService.post("/products", product);
      } catch (err) {
        console.error("Failed to sync product to backend", err);
      }
    })();
  },
  deleteProduct: (id: string) => {
    const products = storageService.getProducts();
    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(products.filter((p) => p.id !== id)),
    );
    (async () => {
      try {
        await apiService.delete(`/products/${id}`);
      } catch (err) {
        console.error("Failed to delete product on backend", err);
      }
    })();
  },
  getStockMovements: (): StockMovement[] => {
    const data = localStorage.getItem(STOCK_MOVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveStockMovement: (mvt: StockMovement) => {
    const movements = storageService.getStockMovements();
    movements.push(mvt);
    localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(movements));
    (async () => {
      try {
        await apiService.post("/stock", mvt);
      } catch (err) {
        console.error("Failed to sync stock movement to backend", err);
      }
    })();
  },
  deleteStockMovement: (id: string) => {
    const movements = storageService.getStockMovements();
    localStorage.setItem(
      STOCK_MOVEMENTS_KEY,
      JSON.stringify(movements.filter((m) => m.id !== id)),
    );
    (async () => {
      try {
        await apiService.delete(`/stock/${id}`);
      } catch (err) {
        console.error("Failed to delete stock movement on backend", err);
      }
    })();
  },
  getProductStock: (
    productId: string,
    centreId: string,
    movements?: StockMovement[],
  ): number => {
    const mvts = movements || storageService.getStockMovements();
    let balance = 0;
    mvts.forEach((m) => {
      m.items.forEach((item) => {
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

    const yearOrders = orders.filter((o) => {
      const parts = o.orderNumber.split("/");
      return parts.length === 2 && parts[1] === currentYear.toString();
    });

    if (yearOrders.length === 0) {
      return `1/${currentYear}`;
    }

    const numbers = yearOrders
      .map((o) => parseInt(o.orderNumber.split("/")[0]))
      .filter((n) => !isNaN(n));
    const nextNumber = Math.max(...numbers, 0) + 1;

    return `${nextNumber}/${currentYear}`;
  },
  getVehicles: (): Vehicle[] => {
    const data = localStorage.getItem(VEHICLES_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveVehicle: (vehicle: Vehicle) => {
    const vehicles = storageService.getVehicles();
    const index = vehicles.findIndex((v) => v.id === vehicle.id);
    const updatedVehicles = [...vehicles];
    if (index >= 0) updatedVehicles[index] = vehicle;
    else updatedVehicles.push(vehicle);
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(updatedVehicles));
  },
  deleteVehicle: (id: string) => {
    const vehicles = storageService.getVehicles();
    localStorage.setItem(
      VEHICLES_KEY,
      JSON.stringify(vehicles.filter((v) => v.id !== id)),
    );
  },
  getMaintenanceRecords: (): MaintenanceRecord[] => {
    const data = localStorage.getItem(MAINTENANCE_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveMaintenanceRecord: (record: MaintenanceRecord) => {
    const records = storageService.getMaintenanceRecords();
    records.push(record);
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(records));
  },
  getFuelRecords: (): FuelRecord[] => {
    const data = localStorage.getItem(FUEL_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveFuelRecord: (record: FuelRecord) => {
    const records = storageService.getFuelRecords();
    records.push(record);
    localStorage.setItem(FUEL_KEY, JSON.stringify(records));
  },
  getDrivers: (): Driver[] => {
    const data = localStorage.getItem(DRIVERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveDriver: (driver: Driver) => {
    const drivers = storageService.getDrivers();
    const index = drivers.findIndex((d) => d.id === driver.id);
    const updatedDrivers = [...drivers];
    if (index >= 0) updatedDrivers[index] = driver;
    else updatedDrivers.push(driver);
    localStorage.setItem(DRIVERS_KEY, JSON.stringify(updatedDrivers));
  },
  deleteDriver: (id: string) => {
    const drivers = storageService.getDrivers();
    localStorage.setItem(
      DRIVERS_KEY,
      JSON.stringify(drivers.filter((d) => d.id !== id)),
    );
  },
};

// Optional helper: fetch initial data from backend and populate local cache.
export async function syncInitialData() {
  try {
    const [orders, suppliers, products, centres, stock] = await Promise.all([
      apiService.get("/orders").catch(() => []),
      apiService.get("/suppliers").catch(() => []),
      apiService.get("/products").catch(() => []),
      apiService.get("/centres").catch(() => []),
      apiService.get("/stock").catch(() => []),
    ]);

    if (orders && orders.length >= 0)
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    if (suppliers && suppliers.length >= 0)
      localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
    if (products && products.length >= 0)
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    if (centres && centres.length >= 0)
      localStorage.setItem(CENTRES_KEY, JSON.stringify(centres));
    if (stock && stock.length >= 0)
      localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(stock));

    return true;
  } catch (err) {
    console.error("Failed to sync initial data", err);
    return false;
  }
}

export const formatCurrency = (val: number) => {
  return (
    val.toLocaleString("fr-TN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + " TND"
  );
};
