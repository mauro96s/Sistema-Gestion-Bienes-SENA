'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MisBienes() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Validar autenticación
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.rol !== 'cuentadante') {
        router.push('/dashboard');
      }
      setUser(parsedUser);
    }
  }, [router]);

  // Cargar bienes
  useEffect(() => {
    const fetchBienes = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          usuarioId: user.id,
          search: searchTerm,
          estado: statusFilter
        });

        const response = await fetch(`/api/cuentadantes/mis-bienes?${queryParams}`);
        const data = await response.json();

        if (data.success) {
          setBienes(data.bienes);
        }
      } catch (error) {
        console.error('Error al cargar bienes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBienes();
  }, [user, searchTerm, statusFilter]);

  // Renderizado de estado con colores
  const renderEstado = (estado) => {
    const estados = {
      'disponible': { color: 'bg-green-100 text-green-800', label: 'Disponible' },
      'en_prestamo': { color: 'bg-blue-100 text-blue-800', label: 'En Préstamo' },
      'en_mantenimiento': { color: 'bg-yellow-100 text-yellow-800', label: 'En Mantenimiento' },
      'dado_de_baja': { color: 'bg-red-100 text-red-800', label: 'Dado de Baja' }
    };
    
    const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', label: estado };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mis Bienes Asignados</h1>
        <p className="text-gray-600">Listado de activos bajo su responsabilidad</p>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por código, nombre o serial..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="en_prestamo">En Préstamo</option>
              <option value="en_mantenimiento">En Mantenimiento</option>
            </select>
          </div>
        </div>

        {/* Información de filtros y botón limpiar */}
        {(searchTerm || statusFilter) && (
          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <div>
              {searchTerm && (
                <span>Búsqueda: <span className="font-semibold text-gray-900">"{searchTerm}"</span></span>
              )}
              {searchTerm && statusFilter && <span className="mx-2">•</span>}
              {statusFilter && (
                <span>Estado: <span className="font-semibold text-gray-900">{statusFilter}</span></span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="text-[#39A900] hover:text-[#007832] font-medium flex items-center gap-1 transition-colors duration-150 ml-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Bienes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bien</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código/Serial</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marca/Modelo</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#39A900]"></div>
                      Cargando bienes...
                    </div>
                  </td>
                </tr>
              ) : bienes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron bienes asignados con los filtros actuales.
                  </td>
                </tr>
              ) : (
                bienes.map((bien) => (
                  <tr key={bien.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-[#39A900]/10 flex items-center justify-center text-[#39A900] mr-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{bien.nombre}</div>
                          <div className="text-xs text-gray-500">{bien.descripcion}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{bien.codigo}</div>
                      <div className="text-xs text-gray-500">SN: {bien.serial}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{bien.sede || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{bien.ambiente || 'Sin ambiente asignado'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{bien.marca_nombre || bien.marca}</div>
                      <div className="text-xs text-gray-500">{bien.modelo}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderEstado(bien.estado)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
