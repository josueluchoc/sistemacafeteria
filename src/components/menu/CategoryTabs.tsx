import { useEffect, useRef } from 'react';

interface Category {
  id: number;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export default function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para mantener la categoría seleccionada visible
  useEffect(() => {
    if (scrollRef.current) {
        // Lógica simple para centrar o asegurar visibilidad podría ir aquí
    }
  }, [selectedId]);

  return (
    <div className="sticky top-[60px] z-40 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200/50 pb-1 pt-2">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-2 px-4 py-2 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Ocultar scrollbar
      >
        {/* Opción 'Todos' */}
        <button
          onClick={() => onSelect(0)}
          className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedId === 0
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedId === cat.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}