import AdminLayout from '../../components/admin/AdminLayout';
import TableGrid from '../../components/ui/TableGrid';
import { LayoutGrid } from 'lucide-react';

export default function AdminTables() {
  return (
    <AdminLayout title="Gestión de Mesas">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Diseño del Salón</h2>
          <p className="text-gray-500 text-sm mb-6">
            Haz clic en un espacio vacío para <strong>crear una mesa</strong>.<br/>
            Haz clic en una mesa existente para <strong>eliminarla</strong>.
          </p>
          
          <div className="flex justify-center">
            {/* Modo Editor activado para que el Admin pueda crear/borrar */}
            <TableGrid mode="editor" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}