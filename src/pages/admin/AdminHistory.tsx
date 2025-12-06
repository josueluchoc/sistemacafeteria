import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/admin/AdminLayout';
import { Calendar, Filter, Eye, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../../types';

export default function AdminHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Hoy por defecto
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal Detalle
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [dateFilter, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id ( full_name, email ),
          order_items (
            quantity,
            price_at_time,
            products ( name )
          )
        `)
        .order('created_at', { ascending: false });

      // Filtro por Fecha (Desde las 00:00 hasta las 23:59 del día seleccionado)
      if (dateFilter) {
        const start = `${dateFilter}T00:00:00`;
        const end = `${dateFilter}T23:59:59`;
        query = query.gte('created_at', start).lte('created_at', end);
      }

      // Filtro por Estado
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);

    } catch (error) {
      console.error(error);
      toast.error('Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-gray-100 text-gray-600';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'cancelled': 
      case 'denied': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-50 text-blue-600';
    }
  };

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      pending_verification: 'Por Validar',
      in_kitchen: 'En Cocina',
      ready: 'Listo/Entregado',
      delivered: 'Entregado',
      denied: 'Rechazado',
      cancelled: 'Cancelado'
    };
    return map[status] || status;
  };

  // Cálculo de totales del día mostrado
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'denied')
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <AdminLayout title="Historial de Ventas">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="date" 
                className="pl-10 p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select 
                className="pl-10 p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 appearance-none pr-8"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="ready">Completados</option>
                <option value="denied">Rechazados</option>
                <option value="in_kitchen">En Proceso</option>
              </select>
            </div>
          </div>

          <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 flex flex-col items-end">
            <span className="text-xs text-green-600 font-bold uppercase">Ventas Filtradas</span>
            <span className="text-lg font-bold text-green-800">S/ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="p-4">Hora</th>
                  <th className="p-4">Cliente / Mesa</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No se encontraron pedidos en esta fecha.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4">
                        {order.table_id ? (
                          <span className="font-bold text-gray-800">Mesa {order.table_id}</span> // Idealmente buscar label
                        ) : (
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{order.delivery_name || (order as any).profiles?.full_name || 'Anónimo'}</p>
                            <p className="text-xs text-gray-400">ID: {order.id}</p>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {order.order_type === 'dine_in' && '🍽️ Mesa'}
                        {order.order_type === 'delivery' && '🛵 Delivery'}
                        {order.order_type === 'pickup' && '🛍️ Para Llevar'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                          {translateStatus(order.status)}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-800">
                        S/ {order.total.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleViewDetails(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal de Detalle */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Detalle Pedido #{selectedOrder.id}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Lista Productos */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase">Productos</p>
                {selectedOrder.order_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      <span className="font-bold">{item.quantity}x</span> {item.products?.name}
                    </span>
                    <span className="text-gray-900">S/ {(item.quantity * item.price_at_time).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>S/ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Info Adicional */}
              <div className="bg-blue-50 p-4 rounded-xl text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Fecha:</span>
                  <span className="text-blue-900">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                {selectedOrder.payment_proof_url && (
                  <div className="pt-2">
                    <a 
                      href={selectedOrder.payment_proof_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                    >
                      <FileText className="w-4 h-4" /> Ver Comprobante Pago
                    </a>
                  </div>
                )}
                {selectedOrder.status === 'denied' && (
                  <div className="pt-2 border-t border-blue-200 text-red-600">
                    <strong>Motivo Rechazo:</strong> {selectedOrder.denial_reason}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-gray-900 text-white py-2 rounded-xl font-bold hover:bg-gray-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}