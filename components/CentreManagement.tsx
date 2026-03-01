import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../src/store";
import { saveCentre, deleteCentreAsync } from "../src/store/centresSlice";
import { Centre, HistoryEntry } from "../types";
import { storageService } from "../services/storageService";
import {
  Plus,
  Trash2,
  Search,
  Edit2,
  X,
  Save,
  MapPin,
  Building2,
  AlertTriangle,
  History,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Pagination from "./Pagination";

const CentreManagement: React.FC = () => {
  const centres = useSelector((state: RootState) => state.centres.list);
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCentre, setEditingCentre] = useState<Centre | null>(null);
  const [centreToDelete, setCentreToDelete] = useState<Centre | null>(null);
  const [viewingHistoryCentre, setViewingHistoryCentre] =
    useState<Centre | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenAdd = () => {
    setEditingCentre(null);
    setName("");
    setLocation("");
    setDescription("");
    setIsFormOpen(true);
  };

  const handleEdit = (c: Centre) => {
    setEditingCentre(c);
    setName(c.name);
    setLocation(c.location);
    setDescription(c.description || "");
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    if (centreToDelete) {
      dispatch(deleteCentreAsync(centreToDelete.id) as any);
      setCentreToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newHistory: HistoryEntry[] = [...(editingCentre?.history || [])];
    const timestamp = new Date().toLocaleString("fr-FR");
    const currentUser = "Administrateur";

    if (editingCentre) {
      const diffs: string[] = [];
      if (editingCentre.name !== name)
        diffs.push(`Nom: ${editingCentre.name} -> ${name}`);
      if (editingCentre.location !== location)
        diffs.push(`Emplacement: ${editingCentre.location} -> ${location}`);

      if (diffs.length > 0) {
        newHistory.push({
          id: Math.random().toString(36).substr(2, 9),
          date: timestamp,
          user: currentUser,
          action: "Modification",
          changes: diffs.join(", "),
        });
      }
    } else {
      newHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        date: timestamp,
        user: currentUser,
        action: "Création",
        changes: "Initialisation du centre de coût",
      });
    }

    const centre: Centre = {
      id: editingCentre?.id || Math.random().toString(36).substr(2, 9),
      name,
      location,
      description,
      history: newHistory,
    };
    dispatch(saveCentre(centre) as any);
    setIsFormOpen(false);
  };

  const filteredCentres = centres.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredCentres.length / itemsPerPage);
  const paginatedCentres = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCentres.slice(start, start + itemsPerPage);
  }, [filteredCentres, currentPage]);

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* History Modal */}
      {viewingHistoryCentre && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Suivi du Centre
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewingHistoryCentre.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingHistoryCentre(null)}
                className="p-2 hover:bg-slate-200 rounded-full"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {viewingHistoryCentre.history &&
              viewingHistoryCentre.history.length > 0 ? (
                <div className="space-y-6">
                  {viewingHistoryCentre.history
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-0.5 before:bg-slate-100 last:before:hidden"
                      >
                        <div
                          className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${entry.action === "Création" ? "bg-green-500" : entry.action === "Réception Stock" ? "bg-blue-600" : "bg-amber-500"}`}
                        >
                          {entry.action === "Création" ? (
                            <Plus size={10} className="text-white" />
                          ) : entry.action === "Réception Stock" ? (
                            <Building2 size={10} className="text-white" />
                          ) : (
                            <Edit2 size={10} className="text-white" />
                          )}
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${entry.action === "Création" ? "bg-green-100 text-green-700" : entry.action === "Réception Stock" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {entry.action}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {entry.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <User size={14} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">
                              {entry.user}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 italic">
                            {entry.changes}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History
                    size={48}
                    className="mx-auto text-slate-200 mb-4 opacity-20"
                  />
                  <p className="text-slate-500">Aucun historique disponible.</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 text-right">
              <button
                onClick={() => setViewingHistoryCentre(null)}
                className="px-6 py-2 bg-white border rounded-xl font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {centreToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Voulez-vous supprimer le centre{" "}
                <span className="font-bold text-slate-800">
                  "{centreToDelete.name}"
                </span>{" "}
                ? Cela pourrait affecter la visibilité des anciens bons de
                commande associés.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={() => setCentreToDelete(null)}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher un centre ou emplacement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full xl:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Nouveau Centre
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCentre ? "Modifier le centre" : "Créer un nouveau centre"}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">
                Nom du Centre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Siège Social, Dépôt Sud..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">
                Gouvernorat / Ville
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Tunis, Sfax, Sousse..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">
                Description (Optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 text-slate-500 font-semibold hover:text-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-2"
              >
                <Save size={18} />
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedCentres.map((c) => (
          <div
            key={c.id}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewingHistoryCentre(c)}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <History size={16} />
                </button>
                <button
                  onClick={() => handleEdit(c)}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setCentreToDelete(c)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-1">{c.name}</h4>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-3">
              <MapPin size={14} />
              {c.location}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {c.description ||
                "Aucune description fournie pour ce centre de coût."}
            </p>

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>ID: {c.id}</span>
              <span className="bg-slate-50 px-2 py-0.5 rounded">Actif</span>
            </div>
          </div>
        ))}

        {filteredCentres.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
            <Building2 size={48} className="text-slate-100" />
            <div className="text-center">
              <p className="text-slate-500 font-bold">Aucun centre trouvé</p>
              <p className="text-sm text-slate-400">
                Essayez un autre terme ou créez-en un nouveau.
              </p>
            </div>
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

export default CentreManagement;
