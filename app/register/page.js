'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

export default function Register() {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState({
    documento: '',
    tipo_doc: 'CC',
    nombres: '',
    apellidos: '',
    correo: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud de contraseña
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documento: formData.documento,
          tipo_doc: formData.tipo_doc,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          correo: formData.correo,
          password: formData.password,
          telefono: formData.telefono,
          direccion: formData.direccion
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrarse');
        setLoading(false);
        return;
      }

      // Registro exitoso - redirigir al login
      toast.success('¡Registro exitoso! Ahora puedes iniciar sesión.');
      router.push('/');
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
    setError('');
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
      <div className="relative z-20 flex w-full max-w-7xl mx-auto p-4 lg:p-8">
        {/* Panel izquierdo - Información */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center">
            <img
              src="https://res.cloudinary.com/dil3rjo71/image/upload/v1763990215/logo-de-Sena-sin-fondo-Blanco-300x300_tlss3c.webp"
              alt="SENA Logo"
              className="w-48 h-48 mx-auto mb-6 object-contain drop-shadow-md"
            />
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Sistema de Gestión de Bienes</h2>
            <p className="text-xl opacity-90 mb-6 drop-shadow-md">
              Regístrate para solicitar préstamos de bienes institucionales
            </p>
            <div className="space-y-4 text-base opacity-90 text-left bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <p className="flex items-center gap-3"><span className="text-[#39A900] bg-white rounded-full p-1">✓</span> Solicita bienes de forma rápida</p>
              <p className="flex items-center gap-3"><span className="text-[#39A900] bg-white rounded-full p-1">✓</span> Rastrea el estado de tus solicitudes</p>
              <p className="flex items-center gap-3"><span className="text-[#39A900] bg-white rounded-full p-1">✓</span> Historial de préstamos</p>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario de registro */}
        <div className="flex flex-col w-full lg:w-1/2 items-center justify-center">
          {/* Mobile Logo (Outside Card) */}
          <div className="lg:hidden flex justify-center mb-6">
            <img
              src="https://res.cloudinary.com/dil3rjo71/image/upload/v1763990215/logo-de-Sena-sin-fondo-Blanco-300x300_tlss3c.webp"
              alt="SENA Logo"
              className="w-24 h-24 object-contain drop-shadow-md"
            />
          </div>

          <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto border border-white/20 scrollbar-hide">
            {/* Back Button inside Form */}
            <div className="mb-4 md:absolute md:top-6 md:left-6 md:mb-0">
              <Link
                href="/"
                className="flex items-center gap-2 text-[#39A900] hover:text-[#007832] transition-colors font-bold text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Volver
              </Link>
            </div>
            {/* Logo removed from inside card */}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#39A900] mb-2">Crear Cuenta</h2>
              <p className="text-gray-600 font-medium">Completa el formulario para registrarte</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm col-span-2 font-medium">
                  {error}
                </div>
              )}

              {/* Grid de 2 columnas para todos los campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tipo de Documento */}
                <div>
                  <label htmlFor="tipo_doc" className="block text-sm font-bold text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    id="tipo_doc"
                    name="tipo_doc"
                    value={formData.tipo_doc}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                  >
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                {/* Número de Documento */}
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

                {/* Nombres */}
                <div>
                  <label htmlFor="nombres" className="block text-sm font-bold text-gray-700 mb-2">
                    Nombres
                  </label>
                  <input
                    type="text"
                    id="nombres"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                    placeholder="Juan Carlos"
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label htmlFor="apellidos" className="block text-sm font-bold text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                    placeholder="Pérez García"
                  />
                </div>

                {/* Correo */}
                <div>
                  <label htmlFor="correo" className="block text-sm font-bold text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="telefono" className="block text-sm font-bold text-gray-700 mb-2">
                    Teléfono <span className="text-gray-400 text-xs font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                    placeholder="3001234567"
                  />
                </div>

                {/* Dirección - ancho completo */}
                <div className="md:col-span-2">
                  <label htmlFor="direccion" className="block text-sm font-bold text-gray-700 mb-2">
                    Dirección <span className="text-gray-400 text-xs font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                    placeholder="Calle 123 #45-67"
                  />
                </div>

                {/* Contraseña */}
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
                  <p className="text-xs text-gray-500 mt-1 font-medium">Mínimo 6 caracteres</p>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition text-gray-900 font-medium placeholder:font-normal"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Botón de registro */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-[#39A900] text-white rounded-lg font-bold hover:bg-[#007832] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Registrando...' : 'REGISTRARSE'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/" className="text-[#007832] hover:text-[#39A900] font-bold transition ml-1">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
