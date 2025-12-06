import { Plus } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div className="group relative bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      {/* Imagen del Producto */}
      <div className="relative h-40 overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        
        {/* Tag de Precio Flotante */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          S/ {product.price.toFixed(2)}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-800 text-base leading-tight mb-1">
          {product.name}
        </h3>
        
        <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">
          {product.description || 'Sin descripción disponible.'}
        </p>

        {/* Botón Agregar - Grande para dedos */}
        <button
          onClick={() => onAdd(product)}
          disabled={!product.is_available}
          className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-95 ${
            product.is_available
              ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.is_available ? (
            <>
              <Plus className="w-4 h-4" />
              Agregar
            </>
          ) : (
            'Agotado'
          )}
        </button>
      </div>
    </div>
  );
}