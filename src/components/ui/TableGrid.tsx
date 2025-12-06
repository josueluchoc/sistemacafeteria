import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx'; // Utilidad para clases condicionales

export interface TableData {
  id?: number;
  label: string;
  position_x: number;
  position_y: number;
  is_active: boolean;
}

interface TableGridProps {
  mode: 'editor' | 'selector'; // 'editor' para Admin, 'selector' para Checkout
  onSelect?: (table: TableData) => void;
  selectedTableId?: number | null;
}

export default function TableGrid({ mode, onSelect, selectedTableId }: TableGridProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);

  // Definimos una cuadrícula de 5x5 (25 espacios posibles)
  const ROWS = 5;
  const COLS = 5;

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const { data } = await supabase.from('tables').select('*');
    setTables(data || []);
    setLoading(false);
  };

  const handleCellClick = async (x: number, y: number) => {
    const existingTable = tables.find(t => t.position_x === x && t.position_y === y);

    if (mode === 'editor') {
      // Lógica de Edición (Admin)
      if (existingTable) {
        // Si existe, la borramos (toggle off)
        const { error } = await supabase.from('tables').delete().eq('id', existingTable.id);
        if (!error) {
           setTables(prev => prev.filter(t => t.id !== existingTable.id));
        }
      } else {
        // Si no existe, creamos una nueva
        const label = prompt('Nombre de la mesa (ej: 1, 2, Barra):');
        if (!label) return;

        const { data, error } = await supabase
          .from('tables')
          .insert({ label, position_x: x, position_y: y, is_active: true })
          .select()
          .single();

        if (!error && data) {
           setTables(prev => [...prev, data]);
        }
      }
    } else {
      // Lógica de Selección (Checkout)
      if (existingTable && onSelect) {
        onSelect(existingTable);
      }
    }
  };

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400"/></div>;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Representación visual de la Cafetería */}
      <div 
        className="grid gap-3 p-4 bg-gray-100 rounded-2xl border-2 border-gray-200 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS }).map((_, rowIndex) => (
          Array.from({ length: COLS }).map((_, colIndex) => {
            const table = tables.find(t => t.position_x === colIndex && t.position_y === rowIndex);
            const isSelected = table?.id === selectedTableId;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(colIndex, rowIndex)}
                className={clsx(
                  "w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 relative",
                  // Estilos condicionales
                  !table && mode === 'editor' && "bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer opacity-50",
                  !table && mode === 'selector' && "invisible", // En checkout, espacio vacío es invisible
                  table && "shadow-sm border-2 cursor-pointer",
                  // Colores de Mesa
                  table && !isSelected && "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600",
                  table && isSelected && "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 z-10"
                )}
              >
                {table ? (
                    <>
                        <span className="z-10">{table.label}</span>
                        {/* Efecto de 'patas' de mesa o silla */}
                        <div className={`absolute -bottom-1 w-8 h-1 rounded-full opacity-20 ${isSelected ? 'bg-black' : 'bg-gray-400'}`}></div>
                    </>
                ) : (
                    mode === 'editor' && <span className="text-gray-300 text-xl">+</span>
                )}
              </div>
            );
          })
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
            <span>Libre</span>
        </div>
        <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Seleccionada</span>
        </div>
      </div>
    </div>
  );
}