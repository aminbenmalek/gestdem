
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import { addOrUpdateProduct, removeProduct } from '../src/store/catalogSlice';
import { Product, HistoryEntry } from '../types';
import { formatCurrency } from '../services/storageService';
import { Plus, Trash2, Search, Edit2, X, Save, Package, Filter, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, History, User, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from './Pagination';

type SortKey = 'code' | 'label' | 'defaultUnitPrice';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const ProductCatalog: React.FC = () => {
  const products = useSelector((state: RootState) => state.catalog.products);
  const dispatch = useDispatch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [taxFilter, setTaxFilter] = useState<string>('all');
  const [fodecFilter, setFodecFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'label', direction: 'asc' });
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState(0);
  const [tax, setTax] = useState(19);
  const [fodec, setFodec] = useState(true);
  const [minStock, setMinStock] = useState(0);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setLabel('');
    setCode('');
    setPrice(0);
    setTax(19);
    setFodec(true);
    setMinStock(0);
    setIsFormOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setLabel(p.label);
    setCode(p.code);
    setPrice(p.defaultUnitPrice);
    setTax(p.defaultTaxRate);
    setFodec(p.applyFodec);
    setMinStock(p.minStockLevel || 0);
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      dispatch(removeProduct(productToDelete.id));
      setProductToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newHistory: HistoryEntry[] = [...(editingProduct?.history || [])];
    const timestamp = new Date().toLocaleString('fr-FR');
    const currentUser = "Administrateur";

    if (editingProduct) {
      const diffs: string[] = [];
      if (editingProduct.label !== label) diffs.push(`Désignation: ${editingProduct.label} -> ${label}`);
      if (editingProduct.code !== code) diffs.push(`Code: ${editingProduct.code} -> ${code}`);
      if (editingProduct.minStockLevel !== minStock) diffs.push(`Seuil: ${editingProduct.minStockLevel} -> ${minStock}`);

      if (diffs.length > 0) {
        newHistory.push({
          id: Math.random().toString(36).substr(2, 9),
          date: timestamp,
          user: currentUser,
          action: "Modification",
          changes: diffs.join(', ')
        });
      }
    } else {
      newHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        date: timestamp,
        user: currentUser,
        action: "Création",
        changes: "Initialisation du produit"
      });
    }

    const product: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      code,
      label,
      defaultUnitPrice: price,
      defaultTaxRate: tax,
      applyFodec: fodec,
      minStockLevel: minStock,
      history: newHistory
    };
    
    dispatch(addOrUpdateProduct(product));
    setIsFormOpen(false);
  };

  const toggleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesSearch = p.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTax = taxFilter === 'all' || p.defaultTaxRate.toString() === taxFilter;
      const matchesFodec = fodecFilter === 'all' || 
                          (fodecFilter === 'yes' && p.applyFodec) || 
                          (fodecFilter === 'no' && !p.applyFodec);
      return matchesSearch && matchesTax && matchesFodec;
    });

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [products, searchTerm, taxFilter, fodecFilter, sortConfig]);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(start, start + itemsPerPage);
  }, [processedProducts, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, taxFilter, fodecFilter]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="text-slate-300" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* History and Delete Modals logic already existing */}

      <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row flex-1 w-full gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un article..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
          </div>
        </div>
        <button onClick={handleOpenAdd} className="w-full xl:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          <Plus size={20} /> Nouvel Article
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">{editingProduct ? 'Modifier l\'article' : 'Ajouter au catalogue'}</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Référence / Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Désignation</label>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Prix de base (TND)</label>
              <input type="number" step="0.001" value={price} onChange={e => setPrice(parseFloat(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Seuil Alerte Stock</label>
              <input type="number" value={minStock} onChange={e => setMinStock(parseInt(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-blue-600" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">TVA %</label>
                <select value={tax} onChange={e => setTax(parseInt(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="19">19%</option>
                  <option value="13">13%</option>
                  <option value="7">7%</option>
                  <option value="0">0%</option>
                </select>
              </div>
              <div className="flex flex-col items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">FODEC</label>
                <input type="checkbox" checked={fodec} onChange={e => setFodec(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-end gap-2 pt-4">
              <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"><Save size={18} /> Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer" onClick={() => toggleSort('code')}>Code {renderSortIcon('code')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer" onClick={() => toggleSort('label')}>Désignation {renderSortIcon('label')}</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Seuil Alerte</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer" onClick={() => toggleSort('defaultUnitPrice')}>Prix de base {renderSortIcon('defaultUnitPrice')}</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProducts.map(p => (
              <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-slate-500">{p.code}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{p.label}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Info size={12}/> {p.minStockLevel || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">{p.defaultUnitPrice.toFixed(3)} TND</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                     <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
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
  );
};

export default ProductCatalog;
