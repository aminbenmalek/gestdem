import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./src/store";
import { saveOrder, deleteOrderAsync } from "./src/store/ordersSlice";
import { refreshSuppliers } from "./src/store/suppliersSlice";
import { refreshCentres } from "./src/store/centresSlice";
import { refreshMovements } from "./src/store/stockSlice";
import { ViewType, Order, OrderStatus } from "./types";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import OrderList from "./components/OrderList";
import OrderForm from "./components/OrderForm";
import ProductCatalog from "./components/ProductCatalog";
import CentreManagement from "./components/CentreManagement";
import SupplierManagement from "./components/SupplierManagement";
import StockManagement from "./components/StockManagement";
import { syncInitialData, storageService } from "./services/storageService";
import { setProducts } from "./src/store/catalogSlice";
import { setOrders } from "./src/store/ordersSlice";
import FleetManagement from "./components/FleetManagement";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(
    undefined,
  );

  const orders = useSelector((state: RootState) => state.orders.list);
  const dispatch = useDispatch();

  React.useEffect(() => {
    (async () => {
      try {
        await syncInitialData();
        dispatch(setOrders(storageService.getOrders()));
        dispatch(setProducts(storageService.getProducts()));
        dispatch(refreshSuppliers());
        dispatch(refreshCentres());
        dispatch(refreshMovements());
      } catch (err) {
        console.error("Initial sync failed", err);
      }
    })();
  }, [dispatch]);

  const handleOrderSaved = () => {
    setActiveView("orders");
    setEditingOrder(undefined);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setActiveView("create");
  };

  const handleUpdateStatus = useCallback(
    async (order: Order, newStatus: OrderStatus) => {
      const updatedOrder = { ...order, status: newStatus };
      try {
        await dispatch(saveOrder(updatedOrder) as any);
      } catch (err) {
        console.error("Failed to save order status change", err);
      }

      if (newStatus === OrderStatus.VALIDE) {
        dispatch(refreshMovements());
        dispatch(refreshSuppliers());
        dispatch(refreshCentres());
      }
    },
    [dispatch],
  );

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard orders={orders} />;
      case "orders":
        return (
          <OrderList
            orders={orders}
            onRefresh={() => {}}
            onEdit={handleEditOrder}
            onUpdateStatus={handleUpdateStatus}
            onDelete={(id) => dispatch(deleteOrderAsync(id) as any)}
          />
        );
      case "create":
        return (
          <OrderForm
            onSave={handleOrderSaved}
            onCancel={() => {
              setActiveView("orders");
              setEditingOrder(undefined);
            }}
            initialOrder={editingOrder}
          />
        );
      case "catalog":
        return <ProductCatalog />;
      case "centres":
        return <CentreManagement />;
      case "suppliers":
        return <SupplierManagement />;
      case "stock":
        return <StockManagement />;
      case "fleet":
        return <FleetManagement />;
      default:
        return <Dashboard orders={orders} />;
    }
  };

  return (
    <Layout activeView={activeView} setView={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
