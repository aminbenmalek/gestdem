
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import { addOrUpdateSupplier, removeSupplier } from '../src/store/suppliersSlice';
import { Supplier, HistoryEntry } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, Search, Edit2, X, Save, Users, Mail, MapPin, Phone, Briefcase, FileText, AlertTriangle, History, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from './Pagination';

const SupplierManagement: React.FC = () => {
  const suppliers = useSelector((state: RootState) => state.suppliers.list);
  const dispatch = useDispatch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [viewingHistorySupplier, setViewingHistorySupplier] = useState<Supplier | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [taxId, setTaxId] = useState('');

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCategory('');
    setTaxId('');
    setIsFormOpen(true);
  };

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || '');
    setAddress(s.address);
    setCategory(s.category);
    setTaxId(s.taxId || '');
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      dispatch(removeSupplier(supplierToDelete.id));
      setSupplierToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newHistory: HistoryEntry[] = [...(editingSupplier?.history || [])];
    const timestamp = new Date().toLocaleString('fr-FR');
    const currentUser = "Administrateur";

    if (editingSupplier) {
      const diffs: string[] = [];
      if (editingSupplier.name !== name) diffs.push(`Nom: ${editingSupplier.name} -> ${name}`);
      if (editingSupplier.category !== category) diffs.push(`Catégorie: ${editingSupplier.category} -> ${category}`);
      if (editingSupplier.taxId !== taxId) diffs.push(`Matricule: ${editingSupplier.taxId} -> ${taxId}`);

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
        changes: "Enregistrement du nouveau fournisseur"
      });
    }

    const supplier: Supplier = {
      id: editingSupplier?.id || Math.random().toString(36).substr(2, 9),
      name,
      email,
      phone,
      address,
      category,
      taxId,
      history: newHistory
    };
    
    dispatch(addOrUpdateSupplier(supplier));
    setIsFormOpen(false);
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(start, start + itemsPerPage);
  }, [filteredSuppliers, currentPage]);

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* History Modal */}
      {viewingHistorySupplier && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Suivi Fournisseur</h3>
                  <p className="text-xs text-slate-500 font-medium">{viewingHistorySupplier.name}</p>
                </div>
              </div>
              <button onClick={() => setViewingHistorySupplier(null)} className="p-2 hover:bg-slate-200 rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {viewingHistorySupplier.history && viewingHistorySupplier.history.length > 0 ? (
                <div className="space-y-6">
                  {viewingHistorySupplier.history.slice().reverse().map((entry) => (
                    <div key={entry.id} className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-0.5 before:bg-slate-100 last:before:hidden">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${entry.action === 'Création' ? 'bg-green-500' : 'bg-blue-500'}`}>
                        {entry.action === 'Création' ? <Plus size={10} className="text-white" /> : <Edit2 size={10} className="text-white" />}
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${entry.action === 'Création' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {entry.action}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{entry.date}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">{entry.user}</span>
                        </div>
                        <p className="text-sm text-slate-600 italic">{entry.changes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto text-slate-200 mb-4 opacity-20" />
                  <p className="text-slate-500">Aucun historique disponible.</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 text-right"><button onClick={() => setViewingHistorySupplier(null)} className="px-6 py-2 bg-white border rounded-xl font-bold">Fermer</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Supprimer le fournisseur ?</h3>
              <p className="text-slate-500 leading-relaxed">
                Êtes-vous sûr de vouloir retirer <span className="font-bold text-slate-800">"{supplierToDelete.name}"</span> de votre base de données ?
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button onClick={() => setSupplierToDelete(null)} className="flex-1 py-3 bg-white border text-slate-600 font-bold rounded-2xl">Annuler</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par raison sociale, catégorie ou matricule fiscal..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          className="w-full xl:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} />
          Nouveau Fournisseur
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">
              {editingSupplier ? 'Éditer la fiche fournisseur' : 'Nouveau Partenaire'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Raison Sociale</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Matricule Fiscal</label>
              <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="0000000/X/X/000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Téléphone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Catégorie / Secteur</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Informatique, Bureautique..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Adresse Siège</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-8 py-3 text-slate-500 font-bold">Annuler</button>
              <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"><Save size={20} />Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedSuppliers.map(s => (
          <div key={s.id} className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">
                {s.name.charAt(0)}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setViewingHistorySupplier(s)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><History size={18} /></button>
                <button onClick={() => handleEdit(s)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => setSupplierToDelete(s)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{s.name}</h4>
              <div className="flex items-center gap-1.5 text-blue-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                <Briefcase size={12} />
                {s.category}
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Mail size={14} /></div>
                <span className="truncate">{s.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                <span>{s.phone || "Non renseigné"}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><MapPin size={14} /></div>
                <span className="line-clamp-2">{s.address}</span>
              </div>
              {s.taxId && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><FileText size={14} /></div>
                  <span className="font-mono text-xs font-bold text-slate-400">{s.taxId}</span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
              <div className="text-[10px] font-black uppercase tracking-tighter text-slate-300">ID Partenaire: {s.id}</div>
              <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-widest">Actif</span>
            </div>
          </div>
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
            <Users size={64} className="text-slate-100 mb-4" />
            <p className="text-slate-500 font-bold text-lg">Aucun fournisseur trouvé</p>
            <p className="text-slate-400 max-w-xs mx-auto">Vérifiez vos critères de recherche ou ajoutez un nouveau partenaire commercial.</p>
          </div>
        )}
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />
    </div>
  );
};

export default SupplierManagement;
