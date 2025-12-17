'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    documento: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Guardar usuario en localStorage (temporal, luego usarás JWT)
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Limpiar error al escribir
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://res.cloudinary.com/dil3rjo71/image/upload/v1764564438/senasede_45596492_20240716115731_kwukml.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)',
        }}
      />

      {/* Green Overlay - REMOVED, replaced with neutral dark overlay for legibility */}
      <div className="absolute inset-0 z-10 bg-black/40" />

      {/* Content Container */}
      <div className="relative z-20 flex w-full max-w-6xl mx-auto p-4 lg:p-8">

        {/* Panel izquierdo - Información (Solo Desktop) */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center">
            <img
              src="https://res.cloudinary.com/dil3rjo71/image/upload/v1763990215/logo-de-Sena-sin-fondo-Blanco-300x300_tlss3c.webp"
              alt="SENA Logo"
              className="w-48 h-48 mx-auto mb-6 object-contain drop-shadow-md"
            />
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Sistema de Gestión de Bienes</h2>
            <p className="text-xl opacity-90 drop-shadow-md">
              Plataforma integral para el control y administración de activos institucionales
            </p>
          </div>
        </div>

        {/* Panel derecho - Formulario de login */}
        <div className="flex flex-col w-full lg:w-1/2 items-center justify-center">
          {/* Mobile Logo (Outside Card) */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="https://res.cloudinary.com/dil3rjo71/image/upload/v1763990215/logo-de-Sena-sin-fondo-Blanco-300x300_tlss3c.webp"
              alt="SENA Logo"
              className="w-32 h-32 object-contain drop-shadow-md"
            />
          </div>

          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Logo removed from inside card */}

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#39A900] mb-2">Bienvenido</h2>
              <p className="text-gray-600 font-medium">Inicia sesión en tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Campo de documento */}
              <div>
                <label htmlFor="documento" className="block text-sm font-bold text-gray-700 mb-2">
                  Número de Documento
                </label>
                <input
                  type="text"
                  id="documento"
                  name="documento"
                  value={formData.documento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                  placeholder="1234567890"
                />
              </div>

              {/* Campo de contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                  placeholder="••••••••"
                />
              </div>

              {/* Recordar y olvidé contraseña */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#39A900] border-gray-300 rounded focus:ring-[#39A900]"
                  />
                  <span className="ml-2 text-sm text-gray-600 font-medium">Recordarme</span>
                </label>
              </div>

              {/* Botón de login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#39A900] text-white rounded-lg font-bold hover:bg-[#007832] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Ingresando...' : 'INGRESAR'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <a href="/register" className="text-[#007832] hover:text-[#39A900] font-bold transition ml-1">
                  Regístrate aquí
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
