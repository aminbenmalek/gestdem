import React from "react";
import { ViewType } from "../types";
import {
  LayoutDashboard,
  FileText,
  Users,
  PlusCircle,
  LogOut,
  Package,
  MapPin,
  ArrowLeftRight,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setView: (view: ViewType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView }) => {
  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "orders", label: "Commandes", icon: FileText },
    { id: "create", label: "Nouveau BC", icon: PlusCircle },
    { id: "catalog", label: "Catalogue", icon: Package },
    { id: "stock", label: "Mouvements Stock", icon: ArrowLeftRight },
    { id: "centres", label: "Centres de coût", icon: MapPin },
    { id: "suppliers", label: "Fournisseurs", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full transition-all duration-300 shadow-2xl z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm"
              aria-hidden="true"
            >
              G
            </div>
            GestDEM
          </h1>
          <p className="text-[10px] text-blue-500 font-bold uppercase">
            DEVELOPPER PAR MOHAMED AMIN
          </p>
        </div>

        <nav
          className="flex-1 px-4 py-4 space-y-1"
          aria-label="Navigation principale"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewType)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset">
            <LogOut size={20} aria-hidden="true" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 ml-64 p-8 outline-none"
        tabIndex={-1}
      >
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {navItems.find((n) => n.id === activeView)?.label}
            </h2>
            <p className="text-slate-600 mt-1 font-medium">
              Gestionnaire de flux d'achat intelligent
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="bg-white p-2 rounded-full border border-slate-200 shadow-sm px-4 flex items-center gap-2"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                aria-hidden="true"
              ></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mode Connecté
              </span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
