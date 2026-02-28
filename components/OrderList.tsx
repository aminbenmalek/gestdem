
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';
import { Order, OrderStatus } from '../types';
import { formatCurrency } from '../services/storageService';
import { Search, Eye, Trash2, MapPin, CheckCircle, XCircle, AlertCircle, Clock, Filter, X, RotateCcw, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from './Pagination';

interface OrderListProps {
  orders: Order[];
  onRefresh: () => void;
  onEdit: (order: Order) => void;
  onUpdateStatus: (order: Order, newStatus: OrderStatus) => void;
  onDelete: (id: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onRefresh, onEdit, onUpdateStatus, onDelete }) => {
  const centres = useSelector((state: RootState) => state.centres.list);
  const suppliers = useSelector((state: RootState) => state.suppliers.list);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterCentreId, setFilterCentreId] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = !filterSupplierId || o.supplierId === filterSupplierId;
    const matchesCentre = !filterCentreId || o.centreId === filterCentreId;
    const matchesStatus = !filterStatus || o.status === filterStatus;
    
    const orderDate = new Date(o.date);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate);
    const matchesEndDate = !endDate || orderDate <= new Date(endDate);

    return matchesSearch && matchesSupplier && matchesCentre && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice().reverse().slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSupplierId, filterCentreId, filterStatus, startDate, endDate]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterSupplierId('');
    setFilterCentreId('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Voulez-vous supprimer ce bon de commande ?')) {
      onDelete(id);
    }
  };

  const handleAction = (e: React.MouseEvent, order: Order, newStatus: OrderStatus) => {
    e.stopPropagation();
    
    let confirmMsg = '';
    switch(newStatus) {
      case OrderStatus.VALIDE:
        confirmMsg = "Confirmer la VALIDATION ? (Cela mettra à jour les stocks)";
        break;
      case OrderStatus.ANNULE:
        confirmMsg = "Confirmer l'ANNULATION de ce bon de commande ?";
        break;
      case OrderStatus.EN_ATTENTE:
        confirmMsg = "Mettre ce bon de commande EN ATTENTE ?";
        break;
      default:
        confirmMsg = "Changer le statut ?";
    }

    if (window.confirm(confirmMsg)) {
      onUpdateStatus(order, newStatus);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case OrderStatus.VALIDE:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 border border-green-200">Validé</span>;
      case OrderStatus.ANNULE:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 border border-red-200">Annulé</span>;
      case OrderStatus.EN_ATTENTE:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 border border-amber-200">En attente</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 border border-blue-200">En cours</span>;
    }
  };

  const activeFiltersCount = [filterSupplierId, filterCentreId, filterStatus, startDate, endDate].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              type="text" 
              placeholder="Rechercher par N° BC..."
              aria-label="Rechercher par numéro de bon de commande"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${showFilters || activeFiltersCount > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Filter size={18} aria-hidden="true" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" aria-label={`${activeFiltersCount} filtres actifs`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div id="advanced-filters" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label htmlFor="supplier-filter" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Fournisseur</label>
              <select 
                id="supplier-filter"
                value={filterSupplierId}
                onChange={e => setFilterSupplierId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tous les fournisseurs</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="centre-filter" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Centre</label>
              <select 
                id="centre-filter"
                value={filterCentreId}
                onChange={e => setFilterCentreId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tous les centres</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Statut</label>
              <select 
                id="status-filter"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as OrderStatus | '')}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tous les statuts</option>
                {Object.values(OrderStatus).map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="start-date" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Du</label>
              <input 
                id="start-date"
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="end-date" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Au</label>
                <input 
                  id="end-date"
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={resetFilters}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Réinitialiser les filtres"
                title="Réinitialiser les filtres"
              >
                <RotateCcw size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full border-separate border-spacing-0" aria-label="Liste des bons de commande">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Référence</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Destination</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Fournisseur</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total TTC</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Statut</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedOrders.map(order => {
              const isFinal = order.status === OrderStatus.VALIDE || order.status === OrderStatus.ANNULE;
              
              return (
                <tr 
                  key={order.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => setViewingOrder(order)}
                >
                  <td className="px-6 py-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(order); }}
                      aria-label={`Voir les détails de la commande ${order.orderNumber}`}
                      className="text-left group/ref hover:scale-105 transition-transform origin-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                    >
                      <span className="font-black text-slate-900 block tracking-tight group-hover/ref:text-blue-600 transition-colors">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {new Date(order.date).toLocaleDateString('fr-TN')}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                      <MapPin size={12} className="text-blue-600" aria-hidden="true" />
                      {centres.find(c => c.id === order.centreId)?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                    {suppliers.find(s => s.id === order.supplierId)?.name || 'Inconnu'}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    {formatCurrency(order.totalTTC)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {!isFinal && (
                        <div className="flex gap-1 pr-3 border-r border-slate-100">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAction(e, order, OrderStatus.VALIDE); }}
                            className="p-2 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                            aria-label="Valider la commande"
                            title="Valider la commande"
                          >
                            <CheckCircle size={18} aria-hidden="true" />
                          </button>
                          {order.status !== OrderStatus.EN_ATTENTE && (
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleAction(e, order, OrderStatus.EN_ATTENTE); }}
                              className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                              aria-label="Mettre en attente"
                              title="Mettre en attente"
                            >
                              <Clock size={18} aria-hidden="true" />
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAction(e, order, OrderStatus.ANNULE); }}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Annuler la commande"
                            title="Annuler la commande"
                          >
                            <XCircle size={18} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-1 pl-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Imprimer le bon de commande"
                          title="Imprimer le bon de commande"
                        >
                          <Printer size={18} aria-hidden="true" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(order); }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Voir les détails"
                          title="Voir les détails"
                        >
                          <Eye size={18} aria-hidden="true" />
                        </button>
                        {!isFinal && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(e, order.id); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Supprimer définitivement"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <AlertCircle size={40} className="opacity-20" aria-hidden="true" />
                    <p className="font-bold text-slate-500">Aucune commande ne correspond à votre recherche</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />

      {viewingOrder && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static"
          role="dialog"
          aria-labelledby="order-details-title"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:rounded-none">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
              <h3 id="order-details-title" className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Printer size={20} className="text-blue-700" aria-hidden="true" /> 
                Bon de Commande
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Printer size={18} aria-hidden="true" /> Imprimer
                </button>
                <button 
                  onClick={() => setViewingOrder(null)} 
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
                    <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase">BON DE COMMANDE</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Réf: {viewingOrder.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-xl tracking-tighter">DATE: {new Date(viewingOrder.date).toLocaleDateString('fr-FR')}</p>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Statut: {viewingOrder.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] mb-4">Fournisseur</h4>
                    <p className="text-xl font-black text-slate-900 mb-1">
                      {suppliers.find(s => s.id === viewingOrder.supplierId)?.name || 'Inconnu'}
                    </p>
                    <div className="text-slate-500 text-sm space-y-1 font-medium">
                      <p>{suppliers.find(s => s.id === viewingOrder.supplierId)?.address}</p>
                      <p>{suppliers.find(s => s.id === viewingOrder.supplierId)?.email}</p>
                      <p>{suppliers.find(s => s.id === viewingOrder.supplierId)?.phone}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] mb-4">Lieu de Livraison</h4>
                    <p className="text-xl font-black text-slate-900 mb-1">
                      {centres.find(c => c.id === viewingOrder.centreId)?.name || 'N/A'}
                    </p>
                    <div className="text-slate-500 text-sm space-y-1 font-medium">
                      <p>{centres.find(c => c.id === viewingOrder.centreId)?.location}</p>
                    </div>
                  </div>
                </div>

                {viewingOrder.notes && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Description / Notes</h4>
                    <p className="text-slate-700 font-medium italic">{viewingOrder.notes}</p>
                  </div>
                )}

                <table className="w-full border-collapse" aria-label="Détails des articles de la commande">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th scope="col" className="p-4 text-left font-black uppercase text-[10px] tracking-[0.2em]">Désignation</th>
                      <th scope="col" className="p-4 text-center font-black uppercase text-[10px] tracking-[0.2em] w-24">Qté</th>
                      <th scope="col" className="p-4 text-right font-black uppercase text-[10px] tracking-[0.2em] w-32">P.U HT</th>
                      <th scope="col" className="p-4 text-right font-black uppercase text-[10px] tracking-[0.2em] w-32">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                    {viewingOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold text-slate-800">{item.description}</td>
                        <td className="p-4 text-center text-slate-900 font-black">{item.quantity}</td>
                        <td className="p-4 text-right font-bold text-slate-700">{item.unitPrice.toFixed(3)}</td>
                        <td className="p-4 text-right font-black text-slate-900">{(item.quantity * item.unitPrice).toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex justify-between text-slate-500 text-xs font-black uppercase tracking-widest">
                      <span>Total HT</span>
                      <span>{viewingOrder.totalHT.toFixed(3)}</span>
                    </div>
                    {viewingOrder.totalFodec > 0 && (
                      <div className="flex justify-between text-slate-500 text-xs font-black uppercase tracking-widest">
                        <span>FODEC (1%)</span>
                        <span>{viewingOrder.totalFodec.toFixed(3)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500 text-xs font-black uppercase tracking-widest">
                      <span>Total TVA</span>
                      <span>{viewingOrder.totalTVA.toFixed(3)}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between text-blue-700 font-black text-xl tracking-tighter">
                      <span className="uppercase text-xs self-center tracking-widest">Total TTC</span>
                      <span>{viewingOrder.totalTTC.toFixed(3)} TND</span>
                    </div>
                  </div>
                </div>

                <div className="pt-20 grid grid-cols-2 gap-20">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12">Cachet et Signature Fournisseur</p>
                    <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12">Cachet et Signature Direction</p>
                    <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
