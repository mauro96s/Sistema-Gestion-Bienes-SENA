'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import Pagination from '@/app/components/Pagination';

export default function HistorialAsignaciones() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [user, setUser] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsignacion, setSelectedAsignacion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.rol !== 'almacenista') {
        router.push('/dashboard');
      }
      setUser(parsedUser);
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchAsignaciones();
    }
  }, [user]);

  const fetchAsignaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/asignaciones');
      const data = await response.json();

      if (data.success) {
        setAsignaciones(data.asignaciones);
      } else {
        setError('Error al cargar asignaciones');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de estado con colores
  const renderEstado = (bloqueado) => {
    if (bloqueado) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
          En Préstamo
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          Disponible
        </span>
      );
    }
  };

  const handleDesasignar = async (asignacion) => {
    // Verificar si el bien está bloqueado antes de mostrar confirmación
    if (asignacion.bloqueado) {
      toast.error('No se puede desasignar un bien que está actualmente en préstamo');
      return;
    }

    const confirmado = await confirm(
      `¿Estás seguro de desasignar el bien "${asignacion.bien_descripcion}" (${asignacion.bien_placa}) del cuentadante ${asignacion.cuentadante_nombre}?`,
      {
        title: '⚠️ Confirmar Desasignación',
        confirmText: 'Sí, desasignar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    );

    if (!confirmado) return;

    try {
      const response = await fetch(`/api/asignaciones/${asignacion.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Bien desasignado exitosamente');
        fetchAsignaciones(); // Recargar lista
      } else {
        toast.error(data.error || 'Error al desasignar');
      }
    } catch (err) {
      toast.error('Error de conexión al desasignar');
    }
  };

  const handleVerDetalles = (asignacion) => {
    setSelectedAsignacion(asignacion);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const asignacionesFiltradas = asignaciones.filter(a =>
    a.bien_placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.bien_descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.cuentadante_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.ambiente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(asignacionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const asignacionesPaginadas = asignacionesFiltradas.slice(startIndex, endIndex);

  // Reset página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Historial de Asignaciones</h2>
        <p className="text-gray-600">Gestiona las asignaciones de bienes a cuentadantes</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por placa, descripción, cuentadante o ambiente..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
        />

        {/* Información de filtros y botón limpiar */}
        {searchTerm && (
          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <div>
              <span>Búsqueda: <span className="font-semibold text-gray-900">"{searchTerm}"</span></span>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="text-[#39A900] hover:text-[#007832] font-medium flex items-center gap-1 transition-colors duration-150 ml-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Placa</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cuentadante</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ambiente</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha Asignación</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#39A900] border-t-transparent"></div>
                      <p className="text-gray-500 text-sm">Cargando asignaciones...</p>
                    </div>
                  </td>
                </tr>
              ) : asignacionesPaginadas.length > 0 ? (
                asignacionesPaginadas.map((asignacion) => (
                  <tr key={asignacion.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#39A900] rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">{asignacion.bien_placa}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate" title={asignacion.bien_descripcion}>
                        {asignacion.bien_descripcion}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <p className="ml-2 text-sm text-gray-900">{asignacion.cuentadante_nombre}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-sm text-gray-900">{asignacion.ambiente_nombre}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderEstado(asignacion.bloqueado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(asignacion.fecha_asignacion)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleVerDetalles(asignacion)}
                          className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-150 text-sm font-medium"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </button>
                        <button
                          onClick={() => handleDesasignar(asignacion)}
                          disabled={asignacion.bloqueado}
                          className={`inline-flex items-center px-3 py-2 rounded-lg transition-colors duration-150 text-sm font-medium ${
                            asignacion.bloqueado 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title={asignacion.bloqueado ? "No se puede desasignar: bien en préstamo" : "Desasignar bien"}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Desasignar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-medium">No hay asignaciones registradas</p>
                      <p className="text-gray-400 text-sm">Las asignaciones aparecerán aquí cuando se registren</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {!loading && !error && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={asignacionesFiltradas.length}
          itemsPerPage={itemsPerPage}
          itemName="asignaciones"
        />
      )}

      {/* Modal de Detalles */}
      {showModal && selectedAsignacion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#39A900] to-[#007832] text-white px-8 py-5 rounded-t-2xl flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-2xl font-bold">Detalles de Asignación</h3>
                <p className="text-sm text-white/80 mt-1">Placa: {selectedAsignacion.bien_placa}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAsignacion(null);
                }}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 hover:rotate-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              {/* Información del Bien */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#39A900] p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Información del Bien</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Placa</p>
                    <p className="text-lg font-bold text-gray-900">{selectedAsignacion.bien_placa}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
                    <p className="text-base text-gray-900">{selectedAsignacion.bien_descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Información del Cuentadante */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Cuentadante Responsable</h4>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-base font-semibold text-gray-900">{selectedAsignacion.cuentadante_nombre}</p>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Ubicación</h4>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ambiente</p>
                  <p className="text-base font-semibold text-gray-900">{selectedAsignacion.ambiente_nombre}</p>
                </div>
              </div>

              {/* Fecha de Asignación */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-amber-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Fecha de Asignación</h4>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-base font-semibold text-gray-900">{formatDate(selectedAsignacion.fecha_asignacion)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl flex justify-end gap-3 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAsignacion(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  handleDesasignar(selectedAsignacion);
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
              >
                Desasignar Bien
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
