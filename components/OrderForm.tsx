import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../src/store";
import { saveOrder } from "../src/store/ordersSlice";
import { refreshSuppliers } from "../src/store/suppliersSlice";
import { refreshCentres } from "../src/store/centresSlice";
import { refreshMovements } from "../src/store/stockSlice";
import {
  Order,
  OrderItem,
  Supplier,
  Product,
  Centre,
  OrderStatus,
} from "../types";
import { storageService, formatCurrency } from "../services/storageService";
//import { getSmartItemSuggestions, analyzeOrderRisk } from '../services/geminiService';
import {
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Save,
  X,
  Search,
  Package,
  Check,
  Clock,
} from "lucide-react";

interface OrderFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialOrder?: Order;
}

const OrderForm: React.FC<OrderFormProps> = ({
  onSave,
  onCancel,
  initialOrder,
}) => {
  const suppliers = useSelector((state: RootState) => state.suppliers.list);
  const products = useSelector((state: RootState) => state.catalog.products);
  const centres = useSelector((state: RootState) => state.centres.list);
  const dispatch = useDispatch();

  const [supplierId, setSupplierId] = useState(initialOrder?.supplierId || "");
  const [centreId, setCentreId] = useState(initialOrder?.centreId || "");
  const [orderNumber, setOrderNumber] = useState(
    initialOrder?.orderNumber || storageService.getNextOrderNumber(),
  );
  const [date, setDate] = useState(
    initialOrder?.date || new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState(initialOrder?.notes || "");
  const [items, setItems] = useState<OrderItem[]>(initialOrder?.items || []);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  const calculateTotals = () => {
    let totalHT = 0;
    let totalFodec = 0;
    let totalTVA = 0;

    items.forEach((item) => {
      const ht = item.quantity * item.unitPrice;
      const fodec = item.applyFodec ? ht * 0.01 : 0;
      const tva = (ht + fodec) * (item.taxRate / 100);

      totalHT += ht;
      totalFodec += fodec;
      totalTVA += tva;
    });

    return {
      totalHT,
      totalFodec,
      totalTVA,
      totalTTC: totalHT + totalFodec + totalTVA,
    };
  };

  const addProductToOrder = (p: Product) => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: p.id,
      description: p.label,
      quantity: 1,
      unitPrice: p.defaultUnitPrice,
      taxRate: p.defaultTaxRate,
      fodecRate: 0.01,
      applyFodec: p.applyFodec,
    };
    setItems([...items, newItem]);
    setIsModalOpen(false);
    setModalSearch("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  /*const handleAiSuggest = async () => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    if (!selectedSupplier) return alert("Veuillez choisir un fournisseur.");
    
    setIsAiLoading(true);
    const suggestions = await getSmartItemSuggestions(selectedSupplier.category);
    if (suggestions && suggestions.length > 0) {
      const newItems = suggestions.map((s: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        productId: 'ai-suggested',
        fodecRate: 0.01,
        applyFodec: true,
        ...s
      }));
      setItems([...items, ...newItems]);
    }
    setIsAiLoading(false);
  };*/

  /*const handleAnalyzeRisk = async () => {
    if (items.length === 0) return;
    setIsAiLoading(true);
    const analysis = await analyzeOrderRisk({ orderNumber, supplierId, centreId, items });
    setRiskAnalysis(analysis);
    setIsAiLoading(false);
  };*/

  const handleSubmit = async (
    e: React.FormEvent,
    forceStatus?: OrderStatus,
  ) => {
    e.preventDefault();
    if (!supplierId || !centreId || items.length === 0)
      return alert("Veuillez remplir tous les champs obligatoires.");

    const totals = calculateTotals();
    const order: Order = {
      id: initialOrder?.id || Math.random().toString(36).substr(2, 9),
      orderNumber,
      date,
      supplierId,
      centreId,
      status: forceStatus || initialOrder?.status || OrderStatus.EN_COURS,
      items,
      notes,
      ...totals,
    };

    try {
      await dispatch(saveOrder(order) as any);
      if (order.status === OrderStatus.VALIDE) {
        dispatch(refreshMovements());
        dispatch(refreshSuppliers());
        dispatch(refreshCentres());
        alert(
          `Bon de commande ${order.orderNumber} validé. Les stocks ont été mis à jour pour le centre ${centres.find((c) => c.id === centreId)?.name}.`,
        );
      }
      onSave();
    } catch (err) {
      console.error("Failed to save order", err);
      alert("Erreur lors de l'enregistrement de la commande.");
    }
  };

  const filteredModalProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.label.toLowerCase().includes(modalSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(modalSearch.toLowerCase()),
    );
  }, [products, modalSearch]);

  const totals = calculateTotals();
  const isReadOnly =
    initialOrder?.status === OrderStatus.VALIDE ||
    initialOrder?.status === OrderStatus.ANNULE;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Product Selection Modal */}
      {isModalOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Catalogue Articles
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setModalSearch("");
                }}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 border-b border-slate-100">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Filtrer les articles..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredModalProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProductToOrder(p)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Package size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block tracking-widest">
                        {p.code}
                      </span>
                      <span className="font-bold text-slate-800 text-lg group-hover:text-blue-900">
                        {p.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-black text-slate-900">
                      {p.defaultUnitPrice.toFixed(3)}{" "}
                      <span className="text-xs font-normal">TND</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isReadOnly && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 ${initialOrder?.status === OrderStatus.VALIDE ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"}`}
        >
          <AlertTriangle size={20} />
          <p className="text-sm font-bold uppercase tracking-widest">
            Ce bon de commande est {initialOrder?.status} et ne peut plus être
            modifié.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              En-tête de la Commande
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  N° de Commande
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  required
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  required
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  Fournisseur
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  required
                  disabled={isReadOnly}
                >
                  <option value="">Choisir un fournisseur</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  Destination (Centre)
                </label>
                <select
                  value={centreId}
                  onChange={(e) => setCentreId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  required
                  disabled={isReadOnly}
                >
                  <option value="">Sélectionner un centre</option>
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  Description / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires sur la commande..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none"
                  rows={2}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                Articles commandés
              </h3>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Search size={16} /> Catalogue
                  </button>
                  {/* <button 
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isAiLoading || !supplierId}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-100 disabled:opacity-50 transition-all"
                  >
                    <Sparkles size={16} /> IA
                  </button>*/}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 pr-4">Article</th>
                    <th className="pb-4 px-4 w-20">Qté</th>
                    <th className="pb-4 px-4 w-32">P.U (TND)</th>
                    <th className="pb-4 px-4 w-16 text-center">FODEC</th>
                    <th className="pb-4 px-4 w-20">TVA%</th>
                    <th className="pb-4 pl-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-4 pr-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-800"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full bg-slate-100 border-none rounded-lg px-2 py-1.5 text-center font-black text-blue-700"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          step="0.001"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full bg-slate-100 border-none rounded-lg px-2 py-1.5 text-right font-bold"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={item.applyFodec}
                          onChange={(e) =>
                            updateItem(item.id, "applyFodec", e.target.checked)
                          }
                          className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={item.taxRate}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "taxRate",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full bg-slate-100 border-none rounded-lg px-2 py-1.5 text-xs font-bold"
                          disabled={isReadOnly}
                        >
                          <option value="19">19%</option>
                          <option value="13">13%</option>
                          <option value="7">7%</option>
                          <option value="0">0%</option>
                        </select>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        {!isReadOnly && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border-t-4 border-blue-500">
            <h3 className="text-xl font-black mb-6 flex justify-between items-center uppercase tracking-tighter">
              Récapitulatif Financier
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total HT</span>
                <span className="font-mono">{totals.totalHT.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total FODEC</span>
                <span className="font-mono text-amber-400">
                  +{totals.totalFodec.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total TVA</span>
                <span className="font-mono">+{totals.totalTVA.toFixed(3)}</span>
              </div>
              <div className="h-px bg-slate-800 my-4"></div>
              <div className="flex flex-col bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">
                  Net à Payer (TTC)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter">
                    {totals.totalTTC.toFixed(3)}
                  </span>
                  <span className="text-blue-500 font-bold text-xs uppercase">
                    TND
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, OrderStatus.VALIDE)}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg hover:bg-green-700 shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Check size={20} /> Valider et Commander
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Save size={20} /> Enregistrer Brouillon
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-all flex items-center justify-center gap-2"
          >
            <X size={18} /> {isReadOnly ? "Retour" : "Annuler"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
