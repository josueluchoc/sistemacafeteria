import { useState } from 'react';
import { Check, X, Eye, MapPin, Clock } from 'lucide-react'; // <--- Icono ZoomIn
import type { Order } from '../../types';

interface IncomingOrderCardProps {
  order: Order;
  onVerify: (orderId: number, status: 'in_kitchen' | 'denied', reason?: string) => void;
  onViewImage: (imageUrl: string) => void; // <--- Nuevo Prop para abrir el modal
}

export default function IncomingOrderCard({ order, onVerify, onViewImage }: IncomingOrderCardProps) {
  const [isDenying, setIsDenying] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  const timeString = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white border-l-4 border-yellow-400 rounded-r-xl shadow-sm p-4 animate-in slide-in-from-left duration-300 relative">
      
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded mb-1 ${
            order.order_type === 'delivery' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {order.order_type === 'delivery' ? 'Delivery' : 'Recojo'}
          </span>
          <h3 className="font-bold text-gray-800 text-lg leading-tight">Pedido #{order.id}</h3>
          <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
            <Clock className="w-3 h-3" /> {timeString}
          </div>
        </div>
        <div className="text-right">
          <span className="block font-bold text-xl text-blue-600">S/ {order.total.toFixed(2)}</span>
          
          {/* Botón Ver Yape Actualizado */}
          {order.payment_proof_url && (
            <button 
              onClick={() => onViewImage(order.payment_proof_url!)}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 flex items-center gap-1 justify-end mt-1 font-medium transition-colors ml-auto"
            >
              <Eye className="w-3 h-3" /> Ver Yape
            </button>
          )}
        </div>
      </div>

      {/* Datos Clave */}
      <div className="text-sm text-gray-600 mb-4 space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
        {order.delivery_name && (
          <p><span className="font-semibold text-gray-500 text-xs uppercase">Cliente:</span> {order.delivery_name}</p>
        )}
        {order.order_type === 'pickup' && order.scheduled_pickup_at && (
           <p className="text-orange-600 font-medium flex items-center gap-1">
             <Clock className="w-3 h-3" />
             Recojo: {new Date(order.scheduled_pickup_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </p>
        )}
        {order.order_type === 'delivery' && (
          <p className="flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
            <span className="truncate">{order.delivery_address}</span>
          </p>
        )}
      </div>

      {/* Acciones */}
      {!isDenying ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsDenying(true)}
            className="py-2.5 px-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" /> Rechazar
          </button>
          <button
            onClick={() => onVerify(order.id, 'in_kitchen')}
            className="py-2.5 px-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-green-500/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" /> Aceptar
          </button>
        </div>
      ) : (
        <div className="space-y-2 animate-in fade-in bg-red-50 p-3 rounded-xl border border-red-100">
          <p className="text-xs font-bold text-red-800 uppercase">Motivo de rechazo:</p>
          <input
            type="text"
            placeholder="Ej: Captura borrosa..."
            className="w-full text-sm p-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 justify-end pt-1">
            <button 
              onClick={() => setIsDenying(false)}
              className="text-gray-500 text-xs font-medium hover:text-gray-700 px-2 py-1"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onVerify(order.id, 'denied', denialReason)}
              disabled={!denialReason.trim()}
              className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}