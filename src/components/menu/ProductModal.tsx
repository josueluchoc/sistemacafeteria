import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Minus, Plus, ChefHat } from 'lucide-react';
import type { Product } from '../../types';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes: string, selectedModifiers: string[]) => void;
}

interface Modifier {
  id: number;
  name: string;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [loadingMods, setLoadingMods] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      setSelectedModifiers([]);
      
      const fetchMods = async () => {
        setLoadingMods(true);
        const { data } = await supabase
          .from('modifiers')
          .select('id, name')
          .eq('is_available', true);
        setModifiers(data || []);
        setLoadingMods(false);
      };
      fetchMods();
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const toggleModifier = (name: string) => {
    setSelectedModifiers(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name) 
        : [...prev, name]
    );
  };

  const handleConfirm = () => {
    onAddToCart(product, quantity, notes, selectedModifiers);
    onClose();
  };

  return (
    // Z-Index global muy alto para estar encima de todo
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      
      {/* CAPA 1 (Fondo): Z-Index 10
         Aseguramos que el blur se quede ATRÁS
      */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-10" 
        onClick={onClose} 
      />

      {/* CAPA 2 (Contenido): Z-Index 20 + Relative
         Esto fuerza a que la tarjeta flote ENCIMA del blur
      */}
      <div className="relative z-20 bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
        
        {/* Imagen Header */}
        <div className="relative h-48 sm:h-56 bg-gray-100 shrink-0 rounded-t-3xl overflow-hidden">
          {product.image_url ? (
             <img src={product.image_url} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat className="w-12 h-12"/></div>
          )}
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            <span className="text-xl font-bold text-blue-600">S/ {product.price.toFixed(2)}</span>
          </div>
          <p className="text-gray-500 text-sm mb-6">{product.description}</p>

          {/* Sección Modificadores */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Personaliza tu pedido</h3>
            
            {loadingMods ? (
              <div className="flex gap-2"><div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse"/></div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {modifiers.map(mod => {
                  const isSelected = selectedModifiers.includes(mod.name);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => toggleModifier(mod.name)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {mod.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notas Adicionales */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">¿Algo más?</label>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
              placeholder="Ej: La carne bien cocida, sin cebolla..."
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer (Fijo abajo) */}
        <div className="p-4 border-t border-gray-100 bg-white sm:rounded-b-3xl">
          <div className="flex gap-4 items-center">
            
            {/* Cantidad */}
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-700 hover:text-blue-600 font-bold disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-4 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-700 hover:text-blue-600 font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Agregar */}
            <button
              onClick={handleConfirm}
              className="flex-1 py-3.5 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all active:scale-95 flex justify-between px-6 items-center"
            >
              <span>Agregar al Pedido</span>
              <span>S/ {(product.price * quantity).toFixed(2)}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}