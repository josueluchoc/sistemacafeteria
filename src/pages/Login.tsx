import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Coffee, User } from 'lucide-react'; // <--- Importamos User
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // <--- Nuevo estado para el nombre
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // REGISTRO CON NOMBRE
        if (!fullName.trim()) throw new Error('Por favor ingresa tu nombre');

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // <--- Aquí guardamos el nombre en los metadatos
            },
          },
        });
        if (error) throw error;
        toast.success('¡Cuenta creada! Revisa tu correo o inicia sesión.');
      } else {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // --- MEJORA: Obtener nombre para el saludo ---
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .single();

        const name = profileData?.full_name?.split(' ')[0] || ''; // Primer nombre
        toast.success(`Bienvenido de nuevo, ${name}`); // <--- Saludo personalizado
        
        navigate('/menu'); 
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl rounded-3xl p-8 transition-all duration-300">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isSignUp ? 'Crear Cuenta' : 'Cafetería Parroquial'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isSignUp ? 'Únete para pedir desde casa' : 'Ingresa para gestionar o pedir'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* CAMPO DE NOMBRE (SOLO VISIBLE EN REGISTRO) */}
          {isSignUp && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-gray-700 ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? '¿Ya tienes cuenta?' : '¿Quieres pedir online?'}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              {isSignUp ? 'Inicia Sesión' : 'Crea una cuenta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}