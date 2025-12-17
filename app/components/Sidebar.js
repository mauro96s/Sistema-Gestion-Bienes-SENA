'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  PackageIcon,
  UserIcon,
  ClipboardIcon,
  FileIcon,
  UsersIcon,
  SettingsIcon,
  ChartIcon,
  DoorIcon,
  PlusIcon,
  HistoryIcon,
  ClockIcon
} from '../components/Icons';

/**
 * Componente Sidebar Integrado
 * Sidebar que forma parte del layout (no flotante)
 * 
 * Props:
 * - userRole: Rol del usuario
 * - userName: Nombre del usuario
 * - isOpen: Estado de apertura
 * - onToggle: Función para toggle
 */
export default function Sidebar({ userRole, userName, isOpen, onToggle }) {
  const router = useRouter();
  const pathname = usePathname();

  // Definir menús por rol con íconos SVG
  const menuItems = {
    almacenista: [
      {
        label: 'Registrar Bien',
        path: '/dashboard/almacenista/registrar',
        icon: <PlusIcon className="w-6 h-6" />
      },
      {
        label: 'Asignar a Cuentadante',
        path: '/dashboard/almacenista/asignar-bienes',
        icon: <UserIcon className="w-6 h-6" />
      },
      {
        label: 'Inventario Completo',
        path: '/dashboard/almacenista/inventario',
        icon: <PackageIcon className="w-6 h-6" />
      },
      {
        label: 'Historial Asignaciones',
        path: '/dashboard/almacenista/historial-asignaciones',
        icon: <HistoryIcon className="w-6 h-6" />
      }
    ],
    cuentadante: [
      {
        label: 'Mis Bienes Asignados',
        path: '/dashboard/cuentadante/mis-bienes',
        icon: <PackageIcon className="w-6 h-6" />
      },
      {
        label: 'Solicitudes Pendientes',
        path: '/dashboard/cuentadante/pendientes',
        icon: <FileIcon className="w-6 h-6" />
      },
      {
        label: 'Historial',
        path: '/dashboard/cuentadante/historial',
        icon: <HistoryIcon className="w-6 h-6" />
      }
    ],
    administrador: [
      {
        label: 'Solicitudes',
        path: '/dashboard/administrador/solicitudes',
        icon: <FileIcon className="w-6 h-6" />
      },
      {
        label: 'Usuarios',
        path: '/dashboard/administrador/usuarios',
        icon: <UsersIcon className="w-6 h-6" />
      }
    ],
    coordinador: [
      {
        label: 'Solicitudes Pendientes',
        path: '/dashboard/coordinador/pendientes',
        icon: <FileIcon className="w-6 h-6" />
      },
      {
        label: 'Historial',
        path: '/dashboard/coordinador/historial',
        icon: <HistoryIcon className="w-6 h-6" />
      }
    ],
    vigilante: [
      {
        label: 'Autorizar Salidas',
        path: '/dashboard/vigilante/salidas',
        icon: <DoorIcon className="w-6 h-6" />
      },
      {
        label: 'Reingreso de Bienes',
        path: '/dashboard/vigilante/reingreso',
        icon: <PackageIcon className="w-6 h-6" />
      },
      {
        label: 'Historial',
        path: '/dashboard/vigilante/historial',
        icon: <HistoryIcon className="w-6 h-6" />
      }
    ],
    usuario: [
      {
        label: 'Solicitar Bienes',
        path: '/dashboard/usuario/solicitar',
        icon: <PlusIcon className="w-6 h-6" />
      },
      {
        label: 'Mis Solicitudes',
        path: '/dashboard/usuario/solicitudes',
        icon: <ClipboardIcon className="w-6 h-6" />
      }
    ]
  };

  const currentMenu = menuItems[userRole] || [];

  // Función para determinar si una ruta está activa
  const isActiveRoute = (path) => {
    return pathname === path;
  };

  // Función para determinar si el dashboard está activo
  const isDashboardActive = () => {
    return pathname === '/dashboard';
  };

  return (
    <aside
      className={`bg-gradient-to-b from-[#39A900] to-[#007832] text-white transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0'
        } overflow-hidden flex-shrink-0`}
    >
      <div className="flex flex-col h-full">
        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {/* Link a Dashboard - siempre visible para todos los roles */}
            <li>
              <button
                onClick={() => router.push('/dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group border-b border-white/10 mb-2 relative ${
                  isDashboardActive() 
                    ? 'bg-white/20 shadow-lg border-l-4 border-white' 
                    : 'hover:bg-white/10'
                }`}
              >
                <HomeIcon className="w-6 h-6" />
                <span className={`font-medium transition-transform whitespace-nowrap ${
                  isDashboardActive() 
                    ? 'translate-x-1 font-semibold' 
                    : 'group-hover:translate-x-1'
                }`}>
                  Inicio / Dashboard
                </span>
                {/* Indicador de ruta activa */}
                {isDashboardActive() && (
                  <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            </li>

            {currentMenu.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group relative ${
                    isActiveRoute(item.path) 
                      ? 'bg-white/20 shadow-lg border-l-4 border-white' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span className={`font-medium transition-transform whitespace-nowrap ${
                    isActiveRoute(item.path) 
                      ? 'translate-x-1 font-semibold' 
                      : 'group-hover:translate-x-1'
                  }`}>
                    {item.label}
                  </span>
                  {/* Indicador de ruta activa */}
                  {isActiveRoute(item.path) && (
                    <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>


      </div>
    </aside>
  );
}
