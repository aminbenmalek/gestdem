
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';
import { Order, OrderStatus } from '../types';
import { formatCurrency } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Clock, MapPin, AlertCircle, CheckCircle, Hourglass } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  const centres = useSelector((state: RootState) => state.centres.list);
  
  const stats = [
    { label: 'Total Commandes', value: orders.length, icon: TrendingUp, color: 'blue' },
    { label: 'En Cours', value: orders.filter(o => o.status === OrderStatus.EN_COURS).length, icon: Clock, color: 'blue' },
    { label: 'En Attente', value: orders.filter(o => o.status === OrderStatus.EN_ATTENTE).length, icon: Hourglass, color: 'amber' },
    { label: 'Validées', value: orders.filter(o => o.status === OrderStatus.VALIDE).length, icon: CheckCircle, color: 'emerald' },
  ];

  const totalSpend = orders.filter(o => o.status === OrderStatus.VALIDE).reduce((sum, o) => sum + o.totalTTC, 0);

  const dataByCentre = centres.map(c => ({
    name: c.name.split(' - ')[0],
    total: orders.filter(o => o.centreId === c.id && o.status === OrderStatus.VALIDE).reduce((sum, o) => sum + o.totalTTC, 0)
  })).filter(d => d.total > 0);

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tighter">Investissements Validés par Centre</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByCentre}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold'}}
                  formatter={(value: number) => [formatCurrency(value), 'Budget Validé']}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                  {dataByCentre.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle size={24} className="text-emerald-400" />
            </div>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Budget Consommé</p>
            <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">
              {totalSpend.toFixed(3)}
            </h2>
            <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">Dinars Tunisiens (TND)</p>
          </div>
          
          <div className="space-y-4 mt-12">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Ratio des centres actifs</p>
            <div className="flex gap-1.5 h-3">
              {dataByCentre.map((d, i) => (
                <div 
                  key={i} 
                  className="h-full rounded-full transition-all hover:scale-y-125" 
                  style={{ width: `${(d.total / totalSpend) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  title={`${d.name}: ${((d.total/totalSpend)*100).toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
