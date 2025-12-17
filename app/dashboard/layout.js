'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import RoleSwitcher from '@/app/components/RoleSwitcher';
import { ToastProvider } from '@/app/components/Toast';
import { ConfirmProvider } from '@/app/components/ConfirmDialog';

/**
 * Layout compartido para todas las rutas de /dashboard
 * Incluye Header + Sidebar que aparecen en todas las vistas
 */
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Inicializar sidebar según tamaño de pantalla
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detectar tamaño de pantalla al montar
  useEffect(() => {
    const handleResize = () => {
      // En pantallas grandes (md: 768px), abrir sidebar por defecto
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Ejecutar al montar
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar usuario desde localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  // Función para cambiar de rol
  const handleCambiarRol = async (nuevoRolId) => {
    try {
      const response = await fetch('/api/auth/cambiar-rol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoRolId })
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(data.user));

        // Actualizar estado local
        setUser(data.user);

        // Redirigir al dashboard principal para mostrar el dashboard del nuevo rol
        router.push('/dashboard');

        // Recargar la página para asegurar que todo se actualice correctamente
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        alert(data.error || 'Error al cambiar de rol');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar de rol');
    }
  };

  // Mostrar loader mientras carga el usuario
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header - Responsive */}
          <header className="bg-gradient-to-r from-[#39A900] to-[#007832] text-white shadow-lg sticky top-0 z-50">
            <div className="px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Left Side: Toggle + Logo + Identity */}
                <div className="flex items-center gap-4">
                  {/* Botón Hamburguesa */}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all flex-shrink-0 md:hidden"
                    aria-label="Toggle sidebar"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {sidebarOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>

                  <div className="flex items-center gap-3">
                    <img
                      src="https://res.cloudinary.com/dil3rjo71/image/upload/v1763990215/logo-de-Sena-sin-fondo-Blanco-300x300_tlss3c.webp"
                      alt="SENA Logo"
                      className="w-10 h-10 object-contain"
                    />
                    <div className="hidden sm:block">
                      <h1 className="text-lg font-bold leading-tight">SENA - Gestión de Bienes</h1>
                      <p className="text-xs opacity-90 font-medium">Sistema de Control de Activos</p>
                    </div>
                  </div>
                </div>

                {/* Right Side: User Info & Controls */}
                <div className="flex items-center gap-4">
                  {/* Componente elegante de cambio de rol */}
                  <RoleSwitcher user={user} onRoleChange={handleCambiarRol} />
                </div>
              </div>
            </div>
          </header>

          {/* Layout: Sidebar + Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
              userRole={user.rol}
              userName={user.nombre}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main Content - aquí se renderiza el children (las páginas) */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
