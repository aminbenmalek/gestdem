
import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './src/store';
import { addOrUpdateOrder, removeOrder } from './src/store/ordersSlice';
import { refreshSuppliers } from './src/store/suppliersSlice';
import { refreshCentres } from './src/store/centresSlice';
import { refreshMovements } from './src/store/stockSlice';
import { ViewType, Order, OrderStatus } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import ProductCatalog from './components/ProductCatalog';
import CentreManagement from './components/CentreManagement';
import SupplierManagement from './components/SupplierManagement';
import StockManagement from './components/StockManagement';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);
  
  const orders = useSelector((state: RootState) => state.orders.list);
  const dispatch = useDispatch();

  const handleOrderSaved = () => {
    setActiveView('orders');
    setEditingOrder(undefined);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setActiveView('create');
  };

  const handleUpdateStatus = useCallback((order: Order, newStatus: OrderStatus) => {
    const updatedOrder = { ...order, status: newStatus };
    dispatch(addOrUpdateOrder(updatedOrder));
    
    if (newStatus === OrderStatus.VALIDE) {
      dispatch(refreshMovements());
      dispatch(refreshSuppliers());
      dispatch(refreshCentres());
    }
  }, [dispatch]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard orders={orders} />;
      case 'orders': return (
        <OrderList 
          orders={orders} 
          onRefresh={() => {}} 
          onEdit={handleEditOrder} 
          onUpdateStatus={handleUpdateStatus} 
          onDelete={(id) => dispatch(removeOrder(id))}
        />
      );
      case 'create': return (
        <OrderForm 
          onSave={handleOrderSaved} 
          onCancel={() => { setActiveView('orders'); setEditingOrder(undefined); }} 
          initialOrder={editingOrder} 
        />
      );
      case 'catalog': return <ProductCatalog />;
      case 'centres': return <CentreManagement />;
      case 'suppliers': return <SupplierManagement />;
      case 'stock': return <StockManagement />;
      default: return <Dashboard orders={orders} />;
    }
  };

  return (
    <Layout activeView={activeView} setView={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
