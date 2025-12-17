'use client';

import { useState, useRef, useEffect } from 'react';
import {
  UserIcon,
  UsersIcon,
  PackageIcon,
  ClipboardIcon,
  AlertIcon,
  DoorIcon
} from '../components/Icons';

/**
 * Componente elegante para cambiar entre roles
 * Solo se muestra si el usuario tiene múltiples roles
 */
export default function RoleSwitcher({ user, onRoleChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // REMOVED: Early return check. Component should always render to show profile and logout.

  const handleRoleClick = (rolId) => {
    setIsOpen(false);
    onRoleChange(rolId);
  };

  // Mapeo de roles a colores e iconos
  const roleStyles = {
    administrador: { color: 'bg-purple-500', icon: <UsersIcon className="w-5 h-5" /> },
    coordinador: { color: 'bg-blue-500', icon: <ClipboardIcon className="w-5 h-5" /> },
    cuentadante: { color: 'bg-green-500', icon: <PackageIcon className="w-5 h-5" /> },
    almacenista: { color: 'bg-orange-500', icon: <PackageIcon className="w-5 h-5" /> },
    usuario: { color: 'bg-teal-500', icon: <UserIcon className="w-5 h-5" /> },
    vigilante: { color: 'bg-gray-500', icon: <DoorIcon className="w-5 h-5" /> }
  };

  const getRoleStyle = (rol) => roleStyles[rol] || roleStyles.usuario;
  const currentRoleStyle = getRoleStyle(user.rol);
  const hasOtherRoles = user.rolesDisponibles && user.rolesDisponibles.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-white">{currentRoleStyle.icon}</span>
          <div className="text-left hidden sm:block leading-tight">
            <p className="text-sm font-bold truncate max-w-[150px]">
              {user.nombres ? `${user.nombres.split(' ')[0]} ${user.apellidos?.split(' ')[0] || ''}` : user.nombre}
            </p>
            <p className="text-[10px] uppercase tracking-wider opacity-90">{user.rol}</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 animate-fadeIn text-gray-800">

          {hasOtherRoles && (
            <>
              <div className="bg-gradient-to-r from-[#39A900] to-[#007832] text-white px-4 py-2">
                <p className="text-xs font-semibold">Cambiar a:</p>
              </div>
              <div className="py-1 max-h-[300px] overflow-y-auto">
                {user.rolesDisponibles.map((rol) => {
                  const style = getRoleStyle(rol.nombre);
                  return (
                    <button
                      key={rol.id}
                      onClick={() => handleRoleClick(rol.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 group border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-500 group-hover:text-[#39A900] transition-colors duration-200">
                        {style.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 capitalize">
                          {rol.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRoleDescription(rol.nombre)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Cerrar Sesión */}
          <div className="border-t border-gray-100 mt-1">
            <button
              onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
              className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors duration-150 flex items-center gap-3 group"
            >
              <span className="text-red-500 group-hover:text-red-700 transition-colors duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-red-600 group-hover:text-red-800">
                  Cerrar Sesión
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Descripciones de roles
function getRoleDescription(rolNombre) {
  const descriptions = {
    administrador: 'Gestión completa del sistema',
    coordinador: 'Aprobación de solicitudes',
    cuentadante: 'Gestión de bienes asignados',
    almacenista: 'Control de inventario',
    usuario: 'Solicitar bienes prestados',
    vigilante: 'Verificación de salidas'
  };
  return descriptions[rolNombre] || 'Acceso al sistema';
}
