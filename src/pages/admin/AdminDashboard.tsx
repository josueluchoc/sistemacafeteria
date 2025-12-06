import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/admin/AdminLayout';
import { TrendingUp, ShoppingBag, Users, DollarSign, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // <--- CORRECCIÓN BUG NAVEGACIÓN
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate(); // Hook para navegar sin recargar
  
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    totalRevenueToday: 0,
    activeProducts: 0,
    totalUsers: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0]; 

    // 1. Pedidos de hoy
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', `${today}T00:00:00`)
      .neq('status', 'cancelled')
      .neq('status', 'denied');

    const totalOrders = orders?.length || 0;
    const revenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;

    // 2. Productos activos
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true);

    // 3. Usuarios totales
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalOrdersToday: totalOrders,
      totalRevenueToday: revenue,
      activeProducts: productsCount || 0,
      totalUsers: usersCount || 0
    });
  };

  const fetchChartData = async () => {
    // Obtener fecha de hace 7 días
    const date = new Date();
    date.setDate(date.getDate() - 6);
    const startDate = date.toISOString().split('T')[0];

    // Consultar pedidos de la última semana
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', `${startDate}T00:00:00`)
      .neq('status', 'cancelled')
      .neq('status', 'denied')
      .order('created_at', { ascending: true });

    if (!orders) return;

    // Agrupar por día
    const groupedData: Record<string, number> = {};
    
    // Inicializar los últimos 7 días en 0 para que el gráfico no se vea vacío
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('es-PE', { weekday: 'short' }); // "lun", "mar"
        groupedData[dayStr] = 0;
    }

    // Sumar ventas reales
    orders.forEach(order => {
        const dayStr = new Date(order.created_at).toLocaleDateString('es-PE', { weekday: 'short' });
        if (groupedData[dayStr] !== undefined) {
            groupedData[dayStr] += order.total;
        }
    });

    // Convertir a formato Recharts (Array de objetos) e invertir para orden cronológico
    const formattedData = Object.entries(groupedData)
        .map(([name, total]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), total }))
        .reverse();

    setChartData(formattedData);
  };

  return (
    <AdminLayout title="Resumen de Operaciones">
      <div className="space-y-6">
        
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Panel de Control</h2>
            <p className="text-gray-400">Bienvenido al sistema de gestión parroquial.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-2xl font-mono font-bold capitalize">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-gray-400 text-sm flex items-center justify-end gap-2">
              <Clock className="w-4 h-4" /> Resumen en tiempo real
            </p>
          </div>
        </div>

        {/* Grid de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Ventas Hoy</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-auto">S/ {stats.totalRevenueToday.toFixed(2)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Pedidos Hoy</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-auto">{stats.totalOrdersToday}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Prod. Activos</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-auto">{stats.activeProducts}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Usuarios</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-auto">{stats.totalUsers}</p>
          </div>

        </div>

        {/* Sección de Gráfico y Accesos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRÁFICO DE VENTAS SEMANAL */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Ventas de la Semana
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#9ca3af'}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#9ca3af'}} 
                            tickFormatter={(value) => `S/ ${value}`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Ventas']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorTotal)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>
          
          {/* Tarjeta de Acción Rápida (FIXED) */}
          <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/30 text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                 <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Gestión de Turnos</h3>
              <p className="text-blue-100 text-sm mb-6">
                Abre o cierra la caja para controlar cuándo pueden pedir los clientes.
              </p>
            </div>
            
            {/* CORRECCIÓN: Usamos navigate() en lugar de window.location */}
            <button 
              onClick={() => navigate('/admin/shifts')} 
              className="relative z-10 bg-white text-blue-700 py-3 px-4 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors flex items-center justify-between group-hover:pr-3"
            >
              Gestionar Ahora
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>

            {/* Decoración de fondo */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}