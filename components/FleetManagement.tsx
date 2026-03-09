import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../src/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
} from "recharts";
import {
  addOrUpdateVehicle,
  removeVehicle,
  addMaintenanceRecord,
  addFuelRecord,
  addOrUpdateDriver,
  removeDriver,
} from "../src/store/fleetSlice";
import {
  Vehicle,
  MaintenanceRecord,
  FuelRecord,
  HistoryEntry,
  Driver,
} from "../types";
import {
  Car,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Calendar,
  Fuel,
  Settings,
  User,
  MapPin,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  Gauge,
  FileText,
  Info,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Printer,
  Bell,
  AlertCircle,
} from "lucide-react";
import Pagination from "./Pagination";

const FleetManagement: React.FC = () => {
  const { vehicles, maintenance, fuel, drivers } = useSelector(
    (state: RootState) => state.fleet,
  );
  const centres = useSelector((state: RootState) => state.centres.list);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "vehicles" | "maintenance" | "fuel" | "assignments"
  >("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);

  // Driver Form states
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverName, setDriverName] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverStatus, setDriverStatus] = useState<"Actif" | "Inactif">(
    "Actif",
  );
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [historyDriver, setHistoryDriver] = useState<Driver | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Vehicle Form states
  const [registration, setRegistration] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [fuelType, setFuelType] = useState<Vehicle["fuelType"]>("Diesel");
  const [currentMileage, setCurrentMileage] = useState(0);
  const [status, setStatus] = useState<Vehicle["status"]>("Disponible");
  const [assignment, setAssignment] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState("");
  const [nextMaintenanceMileage, setNextMaintenanceMileage] = useState(0);

  // Maintenance Form states
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [maintVehicleId, setMaintVehicleId] = useState("");
  const [maintDate, setMaintDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [maintType, setMaintType] =
    useState<MaintenanceRecord["type"]>("Vidange");
  const [maintDescription, setMaintDescription] = useState("");
  const [maintCost, setMaintCost] = useState(0);
  const [maintMileage, setMaintMileage] = useState(0);

  // Fuel Form states
  const [isFuelFormOpen, setIsFuelFormOpen] = useState(false);
  const [fuelVehicleId, setFuelVehicleId] = useState("");
  const [fuelDate, setFuelDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fuelQuantity, setFuelQuantity] = useState(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [fuelUnitPrice, setFuelUnitPrice] = useState(2.525); // Prix moyen actuel en Tunisie
  const [fuelMileage, setFuelMileage] = useState(0);
  const [fuelDriver, setFuelDriver] = useState("");
  const [fuelDestination, setFuelDestination] = useState("");
  const [fuelReason, setFuelReason] = useState("");
  const [fuelRefNumber, setFuelRefNumber] = useState("");
  const [printingMissionOrder, setPrintingMissionOrder] =
    useState<FuelRecord | null>(null);

  const handleOpenFuelForm = () => {
    setFuelVehicleId("");
    setFuelDate(new Date().toISOString().split("T")[0]);
    setFuelQuantity(0);
    setFuelCost(0);
    setFuelUnitPrice(2.525);
    setFuelMileage(0);
    setFuelDriver("");
    setFuelDestination("");
    setFuelReason("");
    setFuelRefNumber("");
    setIsFuelFormOpen(true);
  };

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setRegistration("");
    setBrand("");
    setModel("");
    setYear(new Date().getFullYear());
    setFuelType("Diesel");
    setCurrentMileage(0);
    setStatus("Disponible");
    setAssignment("");
    setInsuranceExpiry("");
    setLastMaintenanceDate("");
    setNextMaintenanceMileage(0);
    setIsVehicleFormOpen(true);
  };

  const handleEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setRegistration(v.registration);
    setBrand(v.brand);
    setModel(v.model);
    setYear(v.year);
    setFuelType(v.fuelType);
    setCurrentMileage(v.currentMileage);
    setStatus(v.status);
    setAssignment(v.assignment || "");
    setInsuranceExpiry(v.insuranceExpiry);
    setLastMaintenanceDate(v.lastMaintenanceDate);
    setNextMaintenanceMileage(v.nextMaintenanceMileage);
    setIsVehicleFormOpen(true);
  };

  const handleSubmitVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().toLocaleString("fr-FR");
    const currentUser = "Administrateur";
    const newHistory: HistoryEntry[] = [...(editingVehicle?.history || [])];

    if (editingVehicle) {
      newHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        date: timestamp,
        user: currentUser,
        action: "Modification",
        changes: `Mise à jour des informations du véhicule ${registration}`,
      });
    } else {
      newHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        date: timestamp,
        user: currentUser,
        action: "Création",
        changes: "Enregistrement du nouveau véhicule",
      });
    }

    const vehicle: Vehicle = {
      id: editingVehicle?.id || Math.random().toString(36).substr(2, 9),
      registration,
      brand,
      model,
      year,
      fuelType,
      currentMileage,
      status,
      assignment,
      insuranceExpiry,
      lastMaintenanceDate,
      nextMaintenanceMileage,
      history: newHistory,
    };

    dispatch(addOrUpdateVehicle(vehicle));
    setIsVehicleFormOpen(false);
  };

  const handleSubmitMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const record: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleId: maintVehicleId,
      date: maintDate,
      type: maintType,
      description: maintDescription,
      cost: maintCost,
      mileageAtMaintenance: maintMileage,
    };
    dispatch(addMaintenanceRecord(record));
    setIsMaintenanceFormOpen(false);
    setMaintDescription("");
    setMaintCost(0);
    setMaintMileage(0);
  };

  const handleSubmitFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const record: FuelRecord = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleId: fuelVehicleId,
      date: fuelDate,
      quantity: fuelQuantity,
      cost: fuelCost,
      mileageAtFueling: fuelMileage,
      driver: fuelDriver,
      destination: fuelDestination,
      reason: fuelReason,
      referenceNumber: fuelRefNumber,
    };
    dispatch(addFuelRecord(record));
    setIsFuelFormOpen(false);
    setFuelQuantity(0);
    setFuelCost(0);
    setFuelUnitPrice(2.525);
    setFuelMileage(0);
    setFuelDriver("");
    setFuelDestination("");
    setFuelReason("");
    setFuelRefNumber("");

    // Auto-open print modal after save
    setPrintingMissionOrder(record);
  };

  const handleOpenDriverForm = (d?: Driver) => {
    if (d) {
      setEditingDriver(d);
      setDriverName(d.name);
      setDriverLicense(d.licenseNumber);
      setDriverPhone(d.phone);
      setDriverStatus(d.status);
    } else {
      setEditingDriver(null);
      setDriverName("");
      setDriverLicense("");
      setDriverPhone("");
      setDriverStatus("Actif");
    }
    setIsDriverFormOpen(true);
  };

  const handleSubmitDriver = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().toLocaleString("fr-FR");
    const currentUser = "Administrateur";
    const newHistory: HistoryEntry[] = [...(editingDriver?.history || [])];

    if (editingDriver) {
      newHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        date: timestamp,
        user: currentUser,
        action: "Modification",
        changes: `Mise à jour des informations du chauffeur ${driverName}`,
      });
    } else {
      newHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        date: timestamp,
        user: currentUser,
        action: "Création",
        changes: "Enregistrement du nouveau chauffeur",
      });
    }

    const driver: Driver = {
      id: editingDriver?.id || Math.random().toString(36).substr(2, 9),
      name: driverName,
      licenseNumber: driverLicense,
      phone: driverPhone,
      status: driverStatus,
      history: newHistory,
    };
    dispatch(addOrUpdateDriver(driver));
    setIsDriverFormOpen(false);
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [vehicles, searchTerm]);

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVehicles.slice(start, start + itemsPerPage);
  }, [filteredVehicles, currentPage]);

  const getStatusColor = (status: Vehicle["status"]) => {
    switch (status) {
      case "Disponible":
        return "bg-green-100 text-green-700 border-green-200";
      case "En service":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "En maintenance":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Hors service":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Dashboard Data
  const fuelByVehicle = useMemo(() => {
    return vehicles
      .map((v) => ({
        name: v.registration,
        total: fuel
          .filter((f) => f.vehicleId === v.id)
          .reduce((sum, f) => sum + f.cost, 0),
      }))
      .filter((d) => d.total > 0);
  }, [vehicles, fuel]);

  const maintenanceByType = useMemo(() => {
    const types = [
      "Vidange",
      "Réparation",
      "Révision",
      "Pneumatiques",
      "Autre",
    ];
    return types
      .map((t) => ({
        name: t,
        value: maintenance
          .filter((m) => m.type === t)
          .reduce((sum, m) => sum + m.cost, 0),
      }))
      .filter((d) => d.value > 0);
  }, [maintenance]);

  const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444"];

  const alerts = useMemo(() => {
    const today = new Date();
    const alertList: {
      id: string;
      type: "insurance" | "maintenance";
      vehicle: Vehicle;
      message: string;
      severity: "critical" | "warning";
    }[] = [];

    vehicles.forEach((v) => {
      // Insurance alerts
      const expiryDate = new Date(v.insuranceExpiry);
      const diffDays = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays <= 0) {
        alertList.push({
          id: `ins-crit-${v.id}`,
          type: "insurance",
          vehicle: v,
          message: `Assurance expirée depuis ${Math.abs(diffDays)} jours`,
          severity: "critical",
        });
      } else if (diffDays <= 30) {
        alertList.push({
          id: `ins-warn-${v.id}`,
          type: "insurance",
          vehicle: v,
          message: `Assurance expire dans ${diffDays} jours`,
          severity: "warning",
        });
      }

      // Maintenance alerts
      const kmRemaining = v.nextMaintenanceMileage - v.currentMileage;
      if (kmRemaining <= 0) {
        alertList.push({
          id: `maint-crit-${v.id}`,
          type: "maintenance",
          vehicle: v,
          message: `Entretien dépassé de ${Math.abs(kmRemaining)} Km`,
          severity: "critical",
        });
      } else if (kmRemaining <= 1000) {
        alertList.push({
          id: `maint-warn-${v.id}`,
          type: "maintenance",
          vehicle: v,
          message: `Entretien prévu dans ${kmRemaining} Km`,
          severity: "warning",
        });
      }
    });

    return alertList;
  }, [vehicles]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 px-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === "dashboard" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Dashboard
          {activeTab === "dashboard" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === "vehicles" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Véhicules
          {activeTab === "vehicles" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === "maintenance" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Entretiens
          {activeTab === "maintenance" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("fuel")}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === "fuel" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Consommation
          {activeTab === "fuel" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === "assignments" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Affectations
          {activeTab === "assignments" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>
          )}
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Bell size={20} className="text-amber-500 animate-bounce" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Alertes Flotte ({alerts.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border flex items-start gap-4 animate-in slide-in-from-left-4 duration-300 ${
                      alert.severity === "critical"
                        ? "bg-red-50 border-red-100 text-red-900"
                        : "bg-amber-50 border-amber-100 text-amber-900"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${alert.severity === "critical" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      <AlertCircle size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-black uppercase tracking-tighter">
                          {alert.vehicle.registration}
                        </p>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            alert.severity === "critical"
                              ? "bg-red-200 border-red-300"
                              : "bg-amber-200 border-amber-300"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-tight">
                        {alert.message}
                      </p>
                      <p className="text-[10px] font-medium opacity-60 mt-1">
                        {alert.vehicle.brand} {alert.vehicle.model}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Total Véhicules
              </p>
              <h4 className="text-3xl font-black text-slate-900">
                {vehicles.length}
              </h4>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold border border-green-100">
                  {vehicles.filter((v) => v.status === "Disponible").length}{" "}
                  Dispo
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100">
                  {vehicles.filter((v) => v.status === "En service").length} En
                  service
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Coût Carburant Total
              </p>
              <h4 className="text-3xl font-black text-blue-600">
                {fuel.reduce((sum, f) => sum + f.cost, 0).toFixed(3)}{" "}
                <span className="text-sm font-bold">TND</span>
              </h4>
              <p className="text-xs text-slate-400 mt-2 font-bold italic">
                Basé sur {fuel.length} enregistrements
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Coût Maintenance Total
              </p>
              <h4 className="text-3xl font-black text-indigo-600">
                {maintenance.reduce((sum, m) => sum + m.cost, 0).toFixed(3)}{" "}
                <span className="text-sm font-bold">TND</span>
              </h4>
              <p className="text-xs text-slate-400 mt-2 font-bold italic">
                Basé sur {maintenance.length} interventions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tighter">
                Consommation par Véhicule (TND)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelByVehicle}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    >
                      {fuelByVehicle.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tighter">
                Répartition Coûts Maintenance
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={maintenanceByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {maintenanceByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {maintenanceByType.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "vehicles" && (
        <div className="space-y-6">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Rechercher par matricule, marque ou modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
            </div>
            <button
              onClick={handleOpenAddVehicle}
              className="w-full xl:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              <Plus size={20} />
              Nouveau Véhicule
            </button>
          </div>

          {isVehicleFormOpen && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingVehicle ? "Éditer le véhicule" : "Nouveau Véhicule"}
                </h3>
                <button
                  onClick={() => setIsVehicleFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={handleSubmitVehicle}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Matricule
                  </label>
                  <input
                    type="text"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                    placeholder="Ex: 123 TUN 4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Marque
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                    placeholder="Ex: Peugeot"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Modèle
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                    placeholder="Ex: 308"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Année
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Type de Carburant
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Essence">Essence</option>
                    <option value="Hybride">Hybride</option>
                    <option value="Electrique">Electrique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Kilométrage Actuel
                  </label>
                  <input
                    type="number"
                    value={currentMileage}
                    onChange={(e) =>
                      setCurrentMileage(parseInt(e.target.value))
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="En service">En service</option>
                    <option value="En maintenance">En maintenance</option>
                    <option value="Hors service">Hors service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Expiration Assurance
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Prochain Entretien (Km)
                  </label>
                  <input
                    type="number"
                    value={nextMaintenanceMileage}
                    onChange={(e) =>
                      setNextMaintenanceMileage(parseInt(e.target.value))
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsVehicleFormOpen(false)}
                    className="px-8 py-3 text-slate-500 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
                  >
                    <Save size={20} />
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedVehicles.map((v) => (
              <div
                key={v.id}
                className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all relative overflow-hidden flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Car size={28} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditVehicle(v)}
                      className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setVehicleToDelete(v)}
                      className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(v.status)}`}
                    >
                      {v.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {v.fuelType}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 leading-tight">
                    {v.brand} {v.model}
                  </h4>
                  <p className="font-mono text-sm font-bold text-blue-600 mt-1">
                    {v.registration}
                  </p>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Gauge size={14} />
                        <span className="text-[10px] font-bold uppercase">
                          Kilométrage
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-700">
                        {v.currentMileage.toLocaleString()} Km
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Calendar size={14} />
                        <span className="text-[10px] font-bold uppercase">
                          Année
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-700">
                        {v.year}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">
                        Assurance
                      </span>
                      <span
                        className={`font-bold ${new Date(v.insuranceExpiry) < new Date() ? "text-red-500" : "text-slate-700"}`}
                      >
                        Exp:{" "}
                        {new Date(v.insuranceExpiry).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">
                        Entretien
                      </span>
                      <span className="font-bold text-slate-700">
                        Next: {v.nextMaintenanceMileage.toLocaleString()} Km
                      </span>
                    </div>
                  </div>

                  {v.assignment && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">
                          Affectation
                        </p>
                        <p className="text-xs font-black text-blue-900">
                          {centres.find((c) => c.id === v.assignment)?.name ||
                            v.assignment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="text-[10px] font-black uppercase tracking-tighter text-slate-300">
                    ID: {v.id}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedVehicle(v)}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => setHistoryVehicle(v)}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <History size={12} /> Historique
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Car size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </h3>
                  <p className="font-mono text-sm font-bold text-blue-600">
                    {selectedVehicle.registration}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Kilométrage
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    {selectedVehicle.currentMileage.toLocaleString()} Km
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Carburant
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    {selectedVehicle.fuelType}
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Assurance
                  </p>
                  <p
                    className={`text-xl font-black ${new Date(selectedVehicle.insuranceExpiry) < new Date() ? "text-red-600" : "text-slate-900"}`}
                  >
                    {new Date(
                      selectedVehicle.insuranceExpiry,
                    ).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Statut
                  </p>
                  <p className="text-xl font-black text-blue-600">
                    {selectedVehicle.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Settings size={16} className="text-blue-600" /> Historique
                    Maintenance
                  </h4>
                  <div className="space-y-3">
                    {maintenance
                      .filter((m) => m.vehicleId === selectedVehicle.id)
                      .slice()
                      .reverse()
                      .map((m) => (
                        <div
                          key={m.id}
                          className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {m.type}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {new Date(m.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-blue-600">
                              {m.cost.toFixed(3)} TND
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {m.mileageAtMaintenance.toLocaleString()} Km
                            </p>
                          </div>
                        </div>
                      ))}
                    {maintenance.filter(
                      (m) => m.vehicleId === selectedVehicle.id,
                    ).length === 0 && (
                      <p className="text-sm text-slate-400 italic font-bold py-4">
                        Aucun entretien enregistré
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Fuel size={16} className="text-blue-600" /> Historique
                    Consommation
                  </h4>
                  <div className="space-y-3">
                    {fuel
                      .filter((f) => f.vehicleId === selectedVehicle.id)
                      .slice()
                      .reverse()
                      .map((f) => (
                        <div
                          key={f.id}
                          className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {f.quantity.toFixed(2)} Litres
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {new Date(f.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">
                              {f.cost.toFixed(3)} TND
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {f.mileageAtFueling.toLocaleString()} Km
                            </p>
                          </div>
                        </div>
                      ))}
                    {fuel.filter((f) => f.vehicleId === selectedVehicle.id)
                      .length === 0 && (
                      <p className="text-sm text-slate-400 italic font-bold py-4">
                        Aucun plein enregistré
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <History size={16} className="text-blue-600" /> Journal
                  d'activité
                </h4>
                <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                  {selectedVehicle.history
                    ?.slice()
                    .reverse()
                    .map((entry, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        {idx !== (selectedVehicle.history?.length || 0) - 1 && (
                          <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-200"></div>
                        )}
                        <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10 mt-1"></div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-slate-900">
                              {entry.action}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {entry.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {entry.changes}
                          </p>
                          <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">
                            Par: {entry.user}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 text-center tracking-tighter mb-2">
              Supprimer le véhicule ?
            </h3>
            <p className="text-slate-500 text-center font-medium mb-8">
              Êtes-vous sûr de vouloir supprimer le véhicule{" "}
              <span className="font-bold text-slate-900">
                {vehicleToDelete.registration}
              </span>{" "}
              ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setVehicleToDelete(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  dispatch(removeVehicle(vehicleToDelete.id));
                  setVehicleToDelete(null);
                }}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">
              Historique des Entretiens
            </h3>
            <button
              onClick={() => setIsMaintenanceFormOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              <Plus size={20} />
              Nouvel Entretien
            </button>
          </div>

          {isMaintenanceFormOpen && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  Enregistrer un Entretien
                </h3>
                <button
                  onClick={() => setIsMaintenanceFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={handleSubmitMaintenance}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Véhicule
                  </label>
                  <select
                    value={maintVehicleId}
                    onChange={(e) => setMaintVehicleId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration} - {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Date
                  </label>
                  <input
                    type="date"
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Type
                  </label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Vidange">Vidange</option>
                    <option value="Réparation">Réparation</option>
                    <option value="Révision">Révision</option>
                    <option value="Pneumatiques">Pneumatiques</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Kilométrage
                  </label>
                  <input
                    type="number"
                    value={maintMileage}
                    onChange={(e) => setMaintMileage(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Coût (TND)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={maintCost}
                    onChange={(e) => setMaintCost(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Description
                  </label>
                  <textarea
                    value={maintDescription}
                    onChange={(e) => setMaintDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    rows={2}
                    placeholder="Détails de l'intervention..."
                  ></textarea>
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceFormOpen(false)}
                    className="px-8 py-3 text-slate-500 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
                  >
                    <Save size={20} />
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full border-separate border-spacing-0">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Véhicule
                  </th>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Type
                  </th>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Description
                  </th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Kilométrage
                  </th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Coût
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {maintenance
                  .slice()
                  .reverse()
                  .map((record) => {
                    const vehicle = vehicles.find(
                      (v) => v.id === record.vehicleId,
                    );
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-6 text-sm font-bold text-slate-600">
                          {new Date(record.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="p-6">
                          <span className="block font-black text-slate-900">
                            {vehicle?.registration || "Inconnu"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            {vehicle?.brand} {vehicle?.model}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            {record.type}
                          </span>
                        </td>
                        <td className="p-6 text-sm text-slate-500 italic max-w-xs truncate">
                          {record.description}
                        </td>
                        <td className="p-6 text-right font-mono text-sm font-bold text-slate-700">
                          {record.mileageAtMaintenance.toLocaleString()} Km
                        </td>
                        <td className="p-6 text-right font-black text-slate-900">
                          {record.cost.toFixed(3)} TND
                        </td>
                      </tr>
                    );
                  })}
                {maintenance.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-slate-400 font-bold italic"
                    >
                      Aucun entretien enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "fuel" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">
              Suivi Consommation
            </h3>
            <button
              onClick={handleOpenFuelForm}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              <Plus size={20} />
              Nouveau Plein
            </button>
          </div>

          {isFuelFormOpen && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  Enregistrer un Plein / Carburant
                </h3>
                <button
                  onClick={() => setIsFuelFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={handleSubmitFuel}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Véhicule
                  </label>
                  <select
                    value={fuelVehicleId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setFuelVehicleId(vId);
                      const vehicle = vehicles.find((v) => v.id === vId);
                      if (vehicle?.driverId) {
                        const driver = drivers.find(
                          (d) => d.id === vehicle.driverId,
                        );
                        if (driver) setFuelDriver(driver.name);
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration} - {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Date
                  </label>
                  <input
                    type="date"
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Prix au Litre (TND)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={fuelUnitPrice}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value);
                      setFuelUnitPrice(price);
                      if (price > 0)
                        setFuelQuantity(
                          parseFloat((fuelCost / price).toFixed(2)),
                        );
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Coût Total (TND)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={fuelCost}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value);
                      setFuelCost(cost);
                      if (fuelUnitPrice > 0)
                        setFuelQuantity(
                          parseFloat((cost / fuelUnitPrice).toFixed(2)),
                        );
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Quantité (Litres)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelQuantity}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value);
                      setFuelQuantity(qty);
                      if (fuelUnitPrice > 0)
                        setFuelCost(
                          parseFloat((qty * fuelUnitPrice).toFixed(3)),
                        );
                    }}
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Kilométrage
                  </label>
                  <input
                    type="number"
                    value={fuelMileage}
                    onChange={(e) => setFuelMileage(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Numéro / Réf.
                  </label>
                  <input
                    type="text"
                    value={fuelRefNumber}
                    onChange={(e) => setFuelRefNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Ex: OM-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Chauffeur
                  </label>
                  {drivers.length > 0 ? (
                    <select
                      value={fuelDriver}
                      onChange={(e) => setFuelDriver(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    >
                      <option value="">Sélectionner un chauffeur</option>
                      {drivers
                        .filter((d) => d.status === "Actif")
                        .map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={fuelDriver}
                      onChange={(e) => setFuelDriver(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="Nom du chauffeur"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={fuelDestination}
                    onChange={(e) => setFuelDestination(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Lieu de destination"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                    Motif / Mission
                  </label>
                  <input
                    type="text"
                    value={fuelReason}
                    onChange={(e) => setFuelReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Objet de la mission"
                    required
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFuelFormOpen(false)}
                    className="px-8 py-3 text-slate-500 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
                  >
                    <Save size={20} />
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full border-separate border-spacing-0">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Véhicule
                  </th>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Chauffeur
                  </th>
                  <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Destination
                  </th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Quantité
                  </th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Kilométrage
                  </th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Coût
                  </th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Prix/L
                  </th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fuel
                  .slice()
                  .reverse()
                  .map((record) => {
                    const vehicle = vehicles.find(
                      (v) => v.id === record.vehicleId,
                    );
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-6 text-sm font-bold text-slate-600">
                          {new Date(record.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="p-6">
                          <span className="block font-black text-slate-900">
                            {vehicle?.registration || "Inconnu"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            {vehicle?.brand} {vehicle?.model}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="text-sm font-bold text-slate-700">
                            {record.driver || "-"}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="text-sm font-bold text-slate-700">
                            {record.destination || "-"}
                          </span>
                        </td>
                        <td className="p-6 text-right font-black text-blue-600">
                          {record.quantity.toFixed(2)} L
                        </td>
                        <td className="p-6 text-right font-mono text-sm font-bold text-slate-700">
                          {record.mileageAtFueling.toLocaleString()} Km
                        </td>
                        <td className="p-6 text-right font-black text-slate-900">
                          {record.cost.toFixed(3)} TND
                        </td>
                        <td className="p-6 text-right text-xs font-bold text-slate-400">
                          {(record.cost / record.quantity).toFixed(3)} TND/L
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => setPrintingMissionOrder(record)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all"
                            title="Imprimer Ordre de Mission"
                          >
                            <Printer size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {fuel.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-slate-400 font-bold italic"
                    >
                      Aucun plein enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-12">
          {/* Drivers Management Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                Gestion des Chauffeurs
              </h3>
              <button
                onClick={() => handleOpenDriverForm()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                <Plus size={20} />
                Nouveau Chauffeur
              </button>
            </div>

            {isDriverFormOpen && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingDriver
                      ? "Modifier le chauffeur"
                      : "Nouveau Chauffeur"}
                  </h3>
                  <button
                    onClick={() => setIsDriverFormOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form
                  onSubmit={handleSubmitDriver}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                      Nom Complet
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                      placeholder="Ex: Ahmed Ben Ali"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                      N° Permis
                    </label>
                    <input
                      type="text"
                      value={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                      placeholder="Ex: 12/345678"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                      placeholder="Ex: +216 22 333 444"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">
                      Statut
                    </label>
                    <select
                      value={driverStatus}
                      onChange={(e) => setDriverStatus(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                  <div className="lg:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsDriverFormOpen(false)}
                      className="px-8 py-3 text-slate-500 font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
                    >
                      <Save size={20} />
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {drivers.map((d) => (
                <div
                  key={d.id}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <User size={24} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenDriverForm(d)}
                        className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDriverToDelete(d)}
                        className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900">{d.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    {d.licenseNumber}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      {d.phone}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setHistoryDriver(d)}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <History size={12} /> Historique
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${d.status === "Actif" ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                      >
                        {d.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {drivers.length === 0 && !isDriverFormOpen && (
                <div className="lg:col-span-4 p-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <User size={48} className="mb-4 opacity-20" />
                  <p className="font-bold italic">Aucun chauffeur enregistré</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Vehicle Assignments Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                Affectations des Véhicules
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                      <Car size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">
                        {v.brand} {v.model}
                      </h4>
                      <p className="font-mono text-xs font-bold text-blue-600">
                        {v.registration}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Centre Affecté
                      </label>
                      <select
                        value={v.assignment || ""}
                        onChange={(e) => {
                          const updated = { ...v, assignment: e.target.value };
                          dispatch(addOrUpdateVehicle(updated));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                      >
                        <option value="">Non affecté</option>
                        {centres.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Chauffeur Attitré
                      </label>
                      <select
                        value={v.driverId || ""}
                        onChange={(e) => {
                          const updated = { ...v, driverId: e.target.value };
                          dispatch(addOrUpdateVehicle(updated));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                      >
                        <option value="">Aucun chauffeur</option>
                        {drivers
                          .filter((d) => d.status === "Actif")
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                      <ShieldCheck size={20} className="text-blue-600" />
                      <p className="text-xs font-bold text-blue-800">
                        Ce véhicule est actuellement {v.status.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Driver Delete Confirmation Modal */}
      {driverToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 text-center tracking-tighter mb-2">
              Supprimer le chauffeur ?
            </h3>
            <p className="text-slate-500 text-center font-medium mb-8">
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-bold text-slate-900">
                {driverToDelete.name}
              </span>{" "}
              ? Il sera désaffecté de tous les véhicules.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDriverToDelete(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  dispatch(removeDriver(driverToDelete.id));
                  setDriverToDelete(null);
                }}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver History Modal */}
      {historyDriver && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                    Historique : {historyDriver.name}
                  </h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                    {historyDriver.licenseNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryDriver(null)}
                className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Missions Section */}
              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" /> Missions &
                  Pleins effectués
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fuel
                    .filter((f) => f.driver === historyDriver.name)
                    .slice()
                    .reverse()
                    .map((f) => {
                      const vehicle = vehicles.find(
                        (v) => v.id === f.vehicleId,
                      );
                      return (
                        <div
                          key={f.id}
                          className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex justify-between items-center hover:border-blue-100 transition-all"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {f.destination || "Destination inconnue"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                              {new Date(f.date).toLocaleDateString("fr-FR")}
                            </p>
                            <p className="text-xs text-slate-500 font-bold">
                              {vehicle?.registration} - {vehicle?.brand}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">
                              {f.cost.toFixed(3)} TND
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {f.quantity.toFixed(2)} L
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  {fuel.filter((f) => f.driver === historyDriver.name)
                    .length === 0 && (
                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <p className="text-sm text-slate-400 italic font-bold">
                        Aucune mission enregistrée
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Administrative History */}
              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <History size={16} className="text-slate-400" /> Journal
                  Administratif
                </h4>
                <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                  {historyDriver.history
                    ?.slice()
                    .reverse()
                    .map((entry, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        {idx !== (historyDriver.history?.length || 0) - 1 && (
                          <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-200"></div>
                        )}
                        <div className="w-4 h-4 rounded-full bg-slate-400 border-4 border-white shadow-sm z-10 mt-1"></div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-slate-900">
                              {entry.action}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {entry.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {entry.changes}
                          </p>
                          <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">
                            Par: {entry.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  {(!historyDriver.history ||
                    historyDriver.history.length === 0) && (
                    <p className="text-xs text-slate-400 italic font-bold">
                      Aucun journal disponible
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle History Modal */}
      {historyVehicle && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                    Historique : {historyVehicle.brand} {historyVehicle.model}
                  </h3>
                  <p className="font-mono text-xs font-bold text-indigo-600">
                    {historyVehicle.registration}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryVehicle(null)}
                className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Maintenance Section */}
              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} className="text-indigo-600" /> Entretiens
                  & Réparations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {maintenance
                    .filter((m) => m.vehicleId === historyVehicle.id)
                    .slice()
                    .reverse()
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex justify-between items-center hover:border-indigo-100 transition-all"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {m.type}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                            {new Date(m.date).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-xs text-slate-500 italic line-clamp-1">
                            {m.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-indigo-600">
                            {m.cost.toFixed(3)} TND
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {m.mileageAtMaintenance.toLocaleString()} Km
                          </p>
                        </div>
                      </div>
                    ))}
                  {maintenance.filter((m) => m.vehicleId === historyVehicle.id)
                    .length === 0 && (
                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <p className="text-sm text-slate-400 italic font-bold">
                        Aucun entretien enregistré
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Fuel Section */}
              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Fuel size={16} className="text-emerald-600" /> Consommation
                  Carburant
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fuel
                    .filter((f) => f.vehicleId === historyVehicle.id)
                    .slice()
                    .reverse()
                    .map((f) => (
                      <div
                        key={f.id}
                        className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex justify-between items-center hover:border-emerald-100 transition-all"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {f.quantity.toFixed(2)} Litres
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            {new Date(f.date).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            Vers: {f.destination || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">
                            {f.cost.toFixed(3)} TND
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {f.mileageAtFueling.toLocaleString()} Km
                          </p>
                        </div>
                      </div>
                    ))}
                  {fuel.filter((f) => f.vehicleId === historyVehicle.id)
                    .length === 0 && (
                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <p className="text-sm text-slate-400 italic font-bold">
                        Aucun plein enregistré
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Mission Order Print Modal */}
      {printingMissionOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 print:bg-white print:p-0 print:static print:inset-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 print:shadow-none print:rounded-none print:max-h-none print:w-full">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Printer size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                  Ordre de Mission
                </h3>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Printer size={16} /> Imprimer
                </button>
                <button
                  onClick={() => setPrintingMissionOrder(null)}
                  className="p-2.5 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
              <div className="border-4 border-slate-900 p-8 min-h-[600px] flex flex-col">
                <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                      Ordre de Mission
                    </h1>
                    <p className="text-lg font-bold text-slate-500">
                      N°{" "}
                      {printingMissionOrder.referenceNumber ||
                        printingMissionOrder.id.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black uppercase tracking-widest">
                      Date d'émission
                    </p>
                    <p className="text-lg font-bold">
                      {new Date(printingMissionOrder.date).toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Véhicule
                      </p>
                      <p className="text-xl font-black text-slate-900 uppercase">
                        {
                          vehicles.find(
                            (v) => v.id === printingMissionOrder.vehicleId,
                          )?.registration
                        }
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        {
                          vehicles.find(
                            (v) => v.id === printingMissionOrder.vehicleId,
                          )?.brand
                        }{" "}
                        {
                          vehicles.find(
                            (v) => v.id === printingMissionOrder.vehicleId,
                          )?.model
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Chauffeur
                      </p>
                      <p className="text-xl font-black text-slate-900 uppercase">
                        {printingMissionOrder.driver}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Destination
                      </p>
                      <p className="text-xl font-black text-slate-900 uppercase">
                        {printingMissionOrder.destination}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Kilométrage au départ
                      </p>
                      <p className="text-xl font-black text-slate-900">
                        {printingMissionOrder.mileageAtFueling.toLocaleString()}{" "}
                        Km
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-12 p-6 bg-slate-50 rounded-2xl border-2 border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Objet de la Mission
                  </p>
                  <p className="text-lg font-bold text-slate-800 italic">
                    "{printingMissionOrder.reason}"
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-12 pt-12 border-t-2 border-slate-100">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12">
                      Signature Chauffeur
                    </p>
                    <div className="h-24 border-b border-dashed border-slate-300"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12">
                      Cachet & Signature Direction
                    </p>
                    <div className="h-24 border-b border-dashed border-slate-300"></div>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Document généré par GestionPro BC -{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
