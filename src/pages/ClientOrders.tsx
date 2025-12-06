import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Loader2, Clock, CheckCircle2, XCircle, ChefHat, MapPin, ShoppingBag, Bike, Store, Image as ImageIcon } from 'lucide-react'; // <--- Nuevos Iconos
import { useNavigate } from 'react-router-dom';
import type { Order } from '../types';

export default function ClientOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      const channel = supabase
        .channel(`my-orders-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const updatedOrder = payload.new as Order;
            // Al actualizar, necesitamos volver a traer los items/productos porque el payload solo trae los datos de la tabla orders
            // Para simplicidad visual inmediata, actualizamos estado, pero idealmente haríamos refetch o un merge inteligente.
            // Haremos refetch para asegurar que las imagenes y detalles no se pierdan en el estado local.
            fetchOrders(); 
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                quantity,
                products ( name, image_url ) 
            )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ayuda visual para los estados (Con Animaciones Nuevas)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200 shadow-sm">
            <Clock className="w-3 h-3" /> 
            Verificando Pago
            {/* Animación de 3 puntos saltando */}
            <span className="flex gap-0.5 ml-1 pt-1">
              <span className="w-1 h-1 bg-yellow-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-yellow-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-yellow-600 rounded-full animate-bounce"></span>
            </span>
          </span>
        );
      case 'in_kitchen':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-200 animate-pulse">
            <ChefHat className="w-3 h-3" /> En Cocina
          </span>
        );
      case 'ready':
        return (
          // Animación de escala (zoom in/out suave) para llamar la atención
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 shadow-sm animate-[pulse_2s_ease-in-out_infinite] scale-105 origin-left">
            <CheckCircle2 className="w-3 h-3" /> ¡Listo para recoger!
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
            Entregado
          </span>
        );
      case 'denied':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">
            <XCircle className="w-3 h-3" /> Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-blue-600" /> Mis Pedidos
        </h1>
        <button 
          onClick={() => navigate('/menu')} 
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          Volver al Menú
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-gray-800 font-bold mb-2">Aún no tienes pedidos</h2>
            <p className="text-gray-500 text-sm mb-6">¿Qué tal si pruebas nuestra hamburguesa especial?</p>
            <button 
              onClick={() => navigate('/menu')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Ir a pedir
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md">
              
              {/* Encabezado Tarjeta */}
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">#{order.id}</span>
                    <span className="text-xs text-gray-400">• {new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="block font-bold text-lg text-gray-900">S/ {order.total.toFixed(2)}</span>
                  
                  {/* Icono Moto o Tienda */}
                  <span className={`text-xs uppercase font-bold tracking-wide flex items-center gap-1 mt-1 ${
                    order.order_type === 'delivery' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {order.order_type === 'delivery' ? (
                        <>
                            <Bike className="w-4 h-4" /> Delivery
                        </>
                    ) : (
                        <>
                            <Store className="w-4 h-4" /> Recojo
                        </>
                    )}
                  </span>
                </div>
              </div>

              {/* Si fue RECHAZADO, mostrar motivo */}
              {order.status === 'denied' && (
                <div className="mb-4 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-bold text-red-800 uppercase mb-1">Motivo del rechazo:</p>
                  <p className="text-sm text-red-700">{order.denial_reason || 'No especificado. Por favor contacta a la parroquia.'}</p>
                </div>
              )}

              {/* Detalles de entrega */}
              {order.status !== 'denied' && order.scheduled_pickup_at && (
                 <div className="mb-4 bg-blue-50 p-3 rounded-xl flex items-center gap-2 text-blue-800 text-sm border border-blue-100">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">Hora Recojo:</span>
                    {new Date(order.scheduled_pickup_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </div>
              )}

              {/* Lista de productos (Detallada con Imagen) */}
              <div className="border-t border-gray-50 pt-3">
                 <p className="text-xs font-bold text-gray-400 uppercase mb-3">Detalle del Pedido</p>
                 <ul className="space-y-3">
                    {/* @ts-ignore - Typescript se queja del join pero funciona */}
                    {order.order_items?.map((item: any, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            {/* IMAGEN MINIATURA */}
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                {item.products?.image_url ? (
                                    <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            
                            {/* TEXTO */}
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                    {item.products?.name}
                                </p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    Cantidad: {item.quantity}
                                </p>
                                {item.modifiers?.notes && (
                                    <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1">
                                        "{item.modifiers.notes}"
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                 </ul>
              </div>

            </div>
          ))
        )}
      </main>
    </div>
  );
}