
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import { addMovement, refreshMovements } from '../src/store/stockSlice';
import { StockMovement, StockMovementItem, Centre, Product, Order, OrderStatus, Supplier } from '../types';
import { storageService } from '../services/storageService';
import { 
  Plus, Printer, Trash2, Search, ArrowRight, X, Save, ArrowLeftRight, 
  Calendar, Package, MapPin, CheckCircle2, Info, ShoppingCart, 
  AlertTriangle, ArrowDown, TrendingUp, BarChart3, History, Bell, ExternalLink, RefreshCw, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import Pagination from './Pagination';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';

const StockManagement: React.FC = () => {
  const movements = useSelector((state: RootState) => state.stock.movements);
  const centres = useSelector((state: RootState) => state.centres.list);
  const products = useSelector((state: RootState) => state.catalog.products);
  const suppliers = useSelector((state: RootState) => state.suppliers.list);
  const ordersFromStore = useSelector((state: RootState) => state.orders.list);
  const dispatch = useDispatch();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [viewingMovement, setViewingMovement] = useState<StockMovement | null>(null);
  const [autoSelectInfo, setAutoSelectInfo] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  const [filterCentreId, setFilterCentreId] = useState('');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'low' | 'critical'>('all');
  const [mvtStartDate, setMvtStartDate] = useState('');
  const [mvtEndDate, setMvtEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Analytics states
  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'alerts' | 'stock'>('stock');
  const [chartProductId, setChartProductId] = useState<string>(products[0]?.id || '');
  const [chartCentreId, setChartCentreId] = useState<string>(centres[0]?.id || '');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (stockLevelFilter === 'all') return true;

      // Check if any centre has low/critical stock for this product
      return centres.some(c => {
        const stock = storageService.getProductStock(p.id, c.id, movements);
        const min = p.minStockLevel || 0;
        if (stockLevelFilter === 'critical') return min > 0 && stock <= (min / 2);
        if (stockLevelFilter === 'low') return min > 0 && stock <= min;
        return true;
      });
    });
  }, [products, searchTerm, stockLevelFilter, centres, movements]);

  // Form states
  const [sourceCentreId, setSourceCentreId] = useState('');
  const [destinationCentreId, setDestinationCentreId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mvtItems, setMvtItems] = useState<StockMovementItem[]>([]);
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setSourceCentreId('');
    setDestinationCentreId('');
    setMvtItems([]);
    setNotes('');
    setAutoSelectInfo(null);
    setIsFormOpen(true);
  };

  const findProductLastKnownLocation = (productId: string): string | null => {
    const sortedOrders = [...ordersFromStore].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const relevantOrder = sortedOrders.find(o => 
      o.status === OrderStatus.VALIDE && 
      o.items.some(item => item.productId === productId)
    ) || sortedOrders.find(o => o.items.some(item => item.productId === productId));
    return relevantOrder ? relevantOrder.centreId : null;
  };

  const handleAddItem = (p: Product) => {
    if (mvtItems.find(i => i.productId === p.id)) return;
    if (!sourceCentreId) {
      const lastLocationId = findProductLastKnownLocation(p.id);
      if (lastLocationId) {
        setSourceCentreId(lastLocationId);
        const centreName = centres.find(c => c.id === lastLocationId)?.name;
        setAutoSelectInfo(`Le centre "${centreName}" a été sélectionné car l'article y a été localisé en dernier.`);
        setTimeout(() => setAutoSelectInfo(null), 5000);
      }
    }
    setMvtItems([...mvtItems, { productId: p.id, label: p.label, quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    const newItems = mvtItems.filter(i => i.productId !== id);
    setMvtItems(newItems);
    if (newItems.length === 0) setAutoSelectInfo(null);
  };

  const updateItemQty = (id: string, qty: number) => {
    const safeQty = isNaN(qty) ? 0 : Math.max(0, qty);
    setMvtItems(mvtItems.map(i => i.productId === id ? { ...i, quantity: safeQty } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCentreId || !destinationCentreId) return alert("Veuillez sélectionner les centres d'origine et de destination.");
    if (sourceCentreId === destinationCentreId) return alert("Le centre de destination doit être différent du centre d'origine.");
    
    if (mvtItems.length === 0) return alert("Veuillez ajouter au moins un article.");

    let hasError = false;
    mvtItems.forEach(item => {
      const available = storageService.getProductStock(item.productId, sourceCentreId, movements);
      if (item.quantity <= 0) {
        alert(`La quantité pour "${item.label}" doit être supérieure à 0.`);
        hasError = true;
      } else if (item.quantity > available) {
        alert(`Stock insuffisant pour "${item.label}". Disponible: ${available}`);
        hasError = true;
      }
    });
    if (hasError) return;

    setIsConfirmModalOpen(true);
  };

  const handleConfirmTransfer = () => {
    if (!sourceCentreId || !destinationCentreId || mvtItems.length === 0) {
      setIsConfirmModalOpen(false);
      return;
    }

    const newMvt: StockMovement = {
      id: Math.random().toString(36).substr(2, 9),
      reference: `MVT-${Date.now().toString().slice(-6)}`,
      date,
      sourceCentreId,
      destinationCentreId,
      items: mvtItems,
      notes
    };

    try {
      dispatch(addMovement(newMvt));
      setIsConfirmModalOpen(false);
      setIsFormOpen(false);
      alert("Transfert effectué avec succès !");
    } catch (error) {
      console.error("Erreur lors du transfert:", error);
      alert("Une erreur est survenue lors de l'enregistrement du transfert.");
    }
  };

  const getSourceDisplay = (id: string) => {
    if (id.startsWith('SUPPLIER:')) {
      const supplierId = id.split(':')[1];
      const supplier = suppliers.find(s => s.id === supplierId);
      return { name: supplier?.name || 'Fournisseur Externe', type: 'Achat', icon: ShoppingCart, color: 'emerald' };
    }
    const centre = centres.find(c => c.id === id);
    return { name: centre?.name || 'Inconnu', type: 'Transfert', icon: MapPin, color: 'slate' };
  };

  const getCentreName = (id: string) => centres.find(c => c.id === id)?.name || 'Inconnu';

  // Analytics Calculation
  const chartData = useMemo(() => {
    if (!chartProductId || !chartCentreId) return [];

    const relevantMovements = movements
      .filter(m => m.items.some(item => item.productId === chartProductId))
      .filter(m => m.sourceCentreId === chartCentreId || m.destinationCentreId === chartCentreId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulativeStock = 0;
    const historyMap = new Map<string, number>();

    relevantMovements.forEach(m => {
      const item = m.items.find(i => i.productId === chartProductId);
      if (item) {
        if (m.destinationCentreId === chartCentreId) cumulativeStock += item.quantity;
        if (m.sourceCentreId === chartCentreId) cumulativeStock -= item.quantity;
        historyMap.set(m.date, cumulativeStock);
      }
    });

    return Array.from(historyMap.entries())
      .map(([date, stock]) => ({
        date: new Date(date).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' }),
        stock: stock,
        fullDate: date
      }));
  }, [movements, chartProductId, chartCentreId]);

  // Available products for the selected source centre
  const availableProductsForSource = useMemo(() => {
    if (!sourceCentreId) return [];
    return products.filter(p => storageService.getProductStock(p.id, sourceCentreId, movements) > 0);
  }, [products, sourceCentreId, movements]);

  const stockAlerts = useMemo(() => {
    const alerts: { product: Product, centre: Centre, stock: number, isCritical: boolean }[] = [];
    centres.forEach(c => {
      products.forEach(p => {
        const stock = storageService.getProductStock(p.id, c.id, movements);
        const min = p.minStockLevel || 0;
        // Alerte si stock inférieur ou égal au seuil ET seuil défini (ou stock à 0)
        if (min > 0 && stock <= min) {
           alerts.push({ 
             product: p, 
             centre: c, 
             stock, 
             isCritical: stock <= (min / 2) || stock === 0 
           });
        }
      });
    });
    return alerts.sort((a, b) => (a.isCritical === b.isCritical) ? 0 : a.isCritical ? -1 : 1);
  }, [movements, products, centres]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = m.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCentreName(m.destinationCentreId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSourceDisplay(m.sourceCentreId).name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProduct = !filterProductId || m.items.some(item => item.productId === filterProductId);
      const matchesCentre = !filterCentreId || m.sourceCentreId === filterCentreId || m.destinationCentreId === filterCentreId;
      
      const mvtDate = new Date(m.date);
      const matchesStartDate = !mvtStartDate || mvtDate >= new Date(mvtStartDate);
      const matchesEndDate = !mvtEndDate || mvtDate <= new Date(mvtEndDate);

      return matchesSearch && matchesProduct && matchesCentre && matchesStartDate && matchesEndDate;
    });
  }, [movements, searchTerm, centres, suppliers, filterProductId, filterCentreId, mvtStartDate, mvtEndDate]);

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice().reverse().slice(start, start + itemsPerPage);
  }, [filteredMovements, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProductId, filterCentreId, mvtStartDate, mvtEndDate]);

  const selectedProductInfo = products.find(p => p.id === chartProductId);
  const currentStockLevel = storageService.getProductStock(chartProductId, chartCentreId, movements);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 px-2" role="tablist" aria-label="Gestion des stocks">
        <button 
          role="tab"
          aria-selected={activeTab === 'stock'}
          aria-controls="stock-panel"
          id="stock-tab"
          onClick={() => setActiveTab('stock')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-lg ${activeTab === 'stock' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Stock Actuel
          {activeTab === 'stock' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" aria-hidden="true"></div>}
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'list'}
          aria-controls="list-panel"
          id="list-tab"
          onClick={() => setActiveTab('list')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-lg ${activeTab === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Historique
          {activeTab === 'list' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" aria-hidden="true"></div>}
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'analytics'}
          aria-controls="analytics-panel"
          id="analytics-tab"
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-lg ${activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Analyse
          {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" aria-hidden="true"></div>}
        </button>
        {/*<button 
          role="tab"
          aria-selected={activeTab === 'alerts'}
          aria-controls="alerts-panel"
          id="alerts-tab"
          onClick={() => setActiveTab('alerts')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset rounded-t-lg ${activeTab === 'alerts' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Alertes 
          {stockAlerts.length > 0 && (
            <span className="bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse" aria-label={`${stockAlerts.length} alertes de stock`}>
              {stockAlerts.length}
            </span>
          )}
          {activeTab === 'alerts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-t-full" aria-hidden="true"></div>}
        </button>*/}
      </div>

      {activeTab === 'stock' ? (
        <div 
          id="stock-panel" 
          role="tabpanel" 
          aria-labelledby="stock-tab"
          className="space-y-6 animate-in fade-in duration-500"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 px-6 flex-1 group focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <Search size={18} className="text-slate-400 group-focus-within:text-blue-500" aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Rechercher un article (Désignation, Code...)" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 w-full py-2 font-medium" 
                aria-label="Rechercher un article"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={stockLevelFilter}
                onChange={e => setStockLevelFilter(e.target.value as any)}
                className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-xs font-bold text-slate-600 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
                aria-label="Filtrer par niveau de stock"
              >
                <option value="all">Tous les niveaux</option>
                <option value="low">Stock Bas</option>
                <option value="critical">Stock Critique</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Inventaire Global</h3>
                <p className="text-sm text-slate-500 font-medium">État des stocks par article et par centre de coût.</p>
              </div>
              <div className="flex gap-2" aria-label="Statistiques rapides">
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs flex items-center gap-2">
                  <Package size={16} aria-hidden="true" />
                  <span>{filteredProducts.length} Articles</span>
                </div>
                <div className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2">
                  <MapPin size={16} aria-hidden="true" />
                  <span>{centres.length} Centres</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0" aria-label="Tableau d'inventaire global">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sticky left-0 bg-slate-50 z-10 border-b border-slate-100">Article</th>
                    {centres.map(c => (
                      <th key={c.id} scope="col" className="p-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 min-w-[150px]">
                        {c.name.split(' - ')[0]}
                      </th>
                    ))}
                    <th scope="col" className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => {
                    let totalProductStock = 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-6 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500" aria-hidden="true">
                              <Package size={20} />
                            </div>
                            <div>
                              <span className="block font-black text-slate-900 tracking-tight">{p.label}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{p.code}</span>
                            </div>
                          </div>
                        </td>
                        {centres.map(c => {
                          const stock = storageService.getProductStock(p.id, c.id, movements);
                          totalProductStock += stock;
                          const isLow = p.minStockLevel && stock <= p.minStockLevel;
                          const isCritical = p.minStockLevel && stock <= (p.minStockLevel / 2);
                          
                          return (
                            <td key={c.id} className="p-6 text-center">
                              <span className={`text-lg font-black ${isCritical ? 'text-red-700' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                                {stock}
                              </span>
                              {isLow && (
                                <div className="mt-1">
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {isCritical ? 'Critique' : 'Bas'}
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-6 text-right">
                          <span className="text-xl font-black text-blue-700">
                            {totalProductStock}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={centres.length + 2} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <AlertTriangle size={40} className="opacity-20" aria-hidden="true" />
                          <p className="font-bold text-slate-500">Aucun article ne correspond à votre recherche</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'alerts' ? (
        <div 
          id="alerts-panel" 
          role="tabpanel" 
          aria-labelledby="alerts-tab"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Diagnostic de Stock</h3>
                <p className="text-sm text-slate-500 font-medium">Réapprovisionnement suggéré pour les articles sous le seuil de sécurité.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-xs" role="status" aria-live="polite">
                <Bell size={16} aria-hidden="true" />
                {stockAlerts.length} Points de vigilance
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {stockAlerts.length > 0 ? stockAlerts.map((alert, idx) => {
                const percentage = Math.min(100, (alert.stock / (alert.product.minStockLevel || 1)) * 100);
                return (
                  <div key={idx} className={`group bg-white p-6 rounded-3xl border ${alert.isCritical ? 'border-red-100 bg-red-50/10' : 'border-slate-100'} hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${alert.isCritical ? 'bg-red-600' : 'bg-amber-600'}`} aria-hidden="true"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${alert.isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`} aria-hidden="true">
                        <Package size={24} />
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${alert.isCritical ? 'bg-red-700 text-white' : 'bg-amber-600 text-white'}`}>
                          {alert.isCritical ? 'CRITIQUE' : 'STOCK BAS'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-black text-slate-900 truncate">{alert.product.label}</h4>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mt-1">
                        <MapPin size={12} className="text-blue-500" />
                        {alert.centre.name}
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Actuel</p>
                          <p className={`text-3xl font-black ${alert.isCritical ? 'text-red-600' : 'text-slate-900'}`}>{alert.stock}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seuil Alerte</p>
                          <p className="text-xl font-bold text-slate-400">{alert.product.minStockLevel}</p>
                        </div>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${alert.isCritical ? 'bg-red-600' : 'bg-amber-500'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <RefreshCw size={14} /> Réapprovisionner
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} />
                  </div>
                  <p className="font-black text-lg text-slate-500">Stocks en parfaite conformité</p>
                  <p className="text-sm font-medium">Aucun article n'est actuellement sous son seuil d'alerte.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'analytics' ? (
        <div 
          id="analytics-panel" 
          role="tabpanel" 
          aria-labelledby="analytics-tab"
          className="space-y-8 animate-in fade-in duration-500"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-1 lg:col-span-1 space-y-6">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" aria-hidden="true" />
                Filtres d'Analyse
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="analytics-product-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Produit</label>
                  <select 
                    id="analytics-product-select"
                    value={chartProductId}
                    onChange={e => setChartProductId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="analytics-centre-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Centre de Coût</label>
                  <select 
                    id="analytics-centre-select"
                    value={chartCentreId}
                    onChange={e => setChartCentreId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <div className="bg-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Stock Actuel</p>
                  <p className="text-4xl font-black">{currentStockLevel}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
                    <div className={`w-2 h-2 rounded-full ${currentStockLevel > (selectedProductInfo?.minStockLevel || 0) ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden="true"></div>
                    {currentStockLevel > (selectedProductInfo?.minStockLevel || 0) ? 'NIVEAU OPTIMAL' : 'ALERTE RÉAPPRO'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-3">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter">Évolution Temporelle du Stock</h3>
                  <p className="text-xs text-slate-500 font-medium">Variation cumulative basée sur les entrées et sorties de stock.</p>
                </div>
              </div>

              <div className="h-[400px] w-full" aria-label="Graphique d'évolution temporelle du stock">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px'}}
                        labelStyle={{fontWeight: 900, color: '#1e293b', marginBottom: '4px'}}
                        itemStyle={{fontWeight: 700, color: '#3b82f6'}}
                      />
                      <Area type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" animationDuration={1500} />
                      {selectedProductInfo?.minStockLevel && (
                        <ReferenceLine y={selectedProductInfo.minStockLevel} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Seuil', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <History size={48} className="opacity-10" aria-hidden="true" />
                    <p className="font-bold text-sm text-slate-500">Aucune donnée historique pour cette sélection.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          id="list-panel" 
          role="tabpanel" 
          aria-labelledby="list-tab"
          className="space-y-6 animate-in fade-in duration-500"
        >
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
                <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex items-center gap-2 px-6 flex-1 group focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <Search size={18} className="text-slate-400 group-focus-within:text-blue-500" aria-hidden="true" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par référence, centre..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full py-2 font-medium" 
                    aria-label="Rechercher un mouvement"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select 
                    value={filterProductId}
                    onChange={e => setFilterProductId(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
                    aria-label="Filtrer par article"
                  >
                    <option value="">Tous les articles</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  
                  <select 
                    value={filterCentreId}
                    onChange={e => setFilterCentreId(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
                    aria-label="Filtrer par centre"
                  >
                    <option value="">Tous les centres</option>
                    {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <button 
                onClick={handleOpenAdd} 
                className="w-full xl:w-auto px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 shadow-xl flex items-center justify-center gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                aria-label="Ajouter un transfert manuel"
              >
                <Plus size={20} aria-hidden="true" /> Transfert Manuel
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <label htmlFor="mvt-start-date" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Du</label>
                <input 
                  id="mvt-start-date"
                  type="date" 
                  value={mvtStartDate}
                  onChange={e => setMvtStartDate(e.target.value)}
                  className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="mvt-end-date" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Au</label>
                <input 
                  id="mvt-end-date"
                  type="date" 
                  value={mvtEndDate}
                  onChange={e => setMvtEndDate(e.target.value)}
                  className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterProductId('');
                  setFilterCentreId('');
                  setMvtStartDate('');
                  setMvtEndDate('');
                }}
                className="ml-auto text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2"
                aria-label="Réinitialiser tous les filtres"
              >
                <RotateCcw size={14} aria-hidden="true" />
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {isFormOpen && (
            <div 
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-300"
              role="dialog"
              aria-labelledby="transfer-form-title"
              aria-modal="true"
            >
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
                <div>
                  <h3 id="transfer-form-title" className="text-3xl font-black text-slate-900 tracking-tighter">Mouvement Manuel</h3>
                  <p className="text-slate-500 font-medium">Gestion des stocks inter-centres.</p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)} 
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label="Fermer le formulaire"
                >
                  <X size={28} className="text-slate-400" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4 relative">
                    <div>
                      <label htmlFor="source-centre" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Origine</label>
                      <select 
                        id="source-centre"
                        value={sourceCentreId} 
                        onChange={e => { setSourceCentreId(e.target.value); setAutoSelectInfo(null); setMvtItems([]); }}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      >
                        <option value="">-- Choisir Origine --</option>
                        {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-center pt-8">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm" aria-hidden="true">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="dest-centre" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Destination</label>
                      <select 
                        id="dest-centre"
                        value={destinationCentreId} 
                        onChange={e => setDestinationCentreId(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      >
                        <option value="">-- Choisir Cible --</option>
                        {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="transfer-date" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Date du transfert</label>
                    <input 
                      id="transfer-date"
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>

                  <div>
                    <label htmlFor="transfer-notes" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Motif / Notes</label>
                    <textarea 
                      id="transfer-notes"
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      rows={4} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Justification..."
                    ></textarea>
                  </div>
                </div>

                <div className="flex flex-col h-full bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Articles à transférer</h4>
                    <select 
                      disabled={!sourceCentreId}
                      onChange={(e) => {
                        const p = products.find(prod => prod.id === e.target.value);
                        if(p) handleAddItem(p);
                        e.target.value = '';
                      }}
                      className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-blue-700 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      aria-label="Ajouter un article au transfert"
                    >
                      {!sourceCentreId ? <option>Choisissez une origine...</option> : availableProductsForSource.length > 0 ? (
                        <>
                          <option value="">+ Ajouter un article</option>
                          {availableProductsForSource.map(p => <option key={p.id} value={p.id}>{p.label} (Dispo: {storageService.getProductStock(p.id, sourceCentreId, movements)})</option>)}
                        </>
                      ) : <option>Aucun article en stock ici</option>}
                    </select>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[400px]" role="list" aria-label="Articles sélectionnés">
                    {mvtItems.map(item => (
                      <div key={item.productId} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center" role="listitem">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center" aria-hidden="true"><Package size={22} /></div>
                          <div>
                            <span className="block font-black text-slate-900 text-sm">{item.label}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Dispo: {storageService.getProductStock(item.productId, sourceCentreId, movements)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={e => updateItemQty(item.productId, parseInt(e.target.value))} 
                            className="w-14 bg-slate-100 border-none rounded-2xl text-center font-black text-blue-700 p-2 focus:ring-2 focus:ring-blue-500" 
                            aria-label={`Quantité pour ${item.label}`}
                          />
                          <button 
                            onClick={() => handleRemoveItem(item.productId)} 
                            className="text-slate-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                            aria-label={`Retirer ${item.label}`}
                          >
                            <Trash2 size={20} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    className="mt-8 w-full py-5 bg-blue-700 text-white rounded-2xl font-black text-xl hover:bg-blue-800 shadow-2xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={mvtItems.length === 0}
                  >
                    Valider le Transfert
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full border-separate border-spacing-0" aria-label="Liste des mouvements de stock">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th scope="col" className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identifiant</th>
                  <th scope="col" className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Flux</th>
                  <th scope="col" className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Motif</th>
                  <th scope="col" className="p-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Détails</th>
                  <th scope="col" className="p-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Qté Totale</th>
                  <th scope="col" className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedMovements.map(m => (
                  <tr 
                    key={m.id} 
                    className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                    onClick={() => setViewingMovement(m)}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white" aria-hidden="true">
                          {m.reference.startsWith('IN-') ? <ShoppingCart size={20} /> : <ArrowLeftRight size={20} />}
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 tracking-tight">{m.reference}</span>
                          <span className="text-xs text-slate-500 font-bold">{new Date(m.date).toLocaleDateString('fr-TN')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-800 text-sm">{getSourceDisplay(m.sourceCentreId).name}</span>
                        <ArrowRight className="text-slate-300" size={16} aria-hidden="true" />
                        <span className="font-bold text-blue-700 text-sm">{getCentreName(m.destinationCentreId)}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[150px]" title={m.notes || ''}>
                        {m.notes || '-'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                       <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">{m.items.length} Réf.</span>
                    </td>
                    <td className="p-6 text-center">
                       <span className="font-black text-slate-900 text-sm">
                         {m.items.reduce((sum, item) => sum + item.quantity, 0)}
                       </span>
                    </td>
                    <td className="p-6 text-right text-slate-300">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingMovement(m); }} 
                          className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                          aria-label={`Voir le bon de mouvement ${m.reference}`}
                        >
                          <Printer size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      )}

      {isConfirmModalOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-labelledby="confirm-modal-title"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center" aria-hidden="true">
                  <AlertTriangle size={24} />
                </div>
                <h3 id="confirm-modal-title" className="text-xl font-black text-slate-900 tracking-tighter">Confirmer le Transfert</h3>
              </div>
              <button 
                onClick={() => setIsConfirmModalOpen(false)} 
                className="p-2 hover:bg-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Fermer la confirmation"
              >
                <X size={20} className="text-slate-400" aria-hidden="true" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-100 rounded-2xl border border-slate-200">
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Origine</p>
                  <p className="font-bold text-slate-900">{getCentreName(sourceCentreId)}</p>
                </div>
                <ArrowRight className="text-blue-600 mx-4" size={20} aria-hidden="true" />
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination</p>
                  <p className="font-bold text-blue-700">{getCentreName(destinationCentreId)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Résumé des articles ({mvtItems.length})</p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2" role="list">
                  {mvtItems.map(item => (
                    <div key={item.productId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100" role="listitem">
                      <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                      <span className="font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg text-sm">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {notes && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-xs">
                  <span className="font-black uppercase not-italic block mb-1 text-[9px] text-slate-500">Note:</span>
                  {notes}
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleConfirmTransfer}
                  className="flex-1 py-4 bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-800 shadow-xl shadow-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingMovement && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static"
          role="dialog"
          aria-labelledby="movement-details-title"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:rounded-none">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
              <h3 id="movement-details-title" className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Printer size={20} className="text-blue-700" aria-hidden="true" /> 
                Bon de Mouvement
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Printer size={18} aria-hidden="true" /> Imprimer
                </button>
                <button 
                  onClick={() => setViewingMovement(null)} 
                  className="p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-lg"
                  aria-label="Fermer les détails"
                >
                  <X size={24} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 print:p-0">
              <div id="print-area" className="space-y-10">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase">BON DE MOUVEMENT</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">{viewingMovement.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-xl tracking-tighter">DATE: {new Date(viewingMovement.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-12">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] mb-4">Unité Expéditrice</h4>
                    <p className="text-xl font-black text-slate-900 mb-1">{getSourceDisplay(viewingMovement.sourceCentreId).name}</p>
                  </div>
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] mb-4">Unité Réceptionnaire</h4>
                    <p className="text-xl font-black text-slate-900 mb-1">{getCentreName(viewingMovement.destinationCentreId)}</p>
                  </div>
                </div>
                <table className="w-full border-collapse" aria-label="Détails des articles du mouvement">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th scope="col" className="p-4 text-left font-black uppercase text-[10px] tracking-[0.2em]">Désignation</th>
                      <th scope="col" className="p-4 text-center font-black uppercase text-[10px] tracking-[0.2em] w-32">Unité</th>
                      <th scope="col" className="p-4 text-right font-black uppercase text-[10px] tracking-[0.2em] w-32">Quantité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                    {viewingMovement.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold text-slate-800">{item.label}</td>
                        <td className="p-4 text-center text-slate-500 font-medium">U</td>
                        <td className="p-4 text-right font-black text-2xl text-slate-900">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
