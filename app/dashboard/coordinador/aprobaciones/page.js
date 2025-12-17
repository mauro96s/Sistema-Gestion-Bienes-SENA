'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import Pagination from '@/app/components/Pagination';

export default function AprobacionesCoordinador() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [observacionRespuesta, setObservacionRespuesta] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Validar autenticación y rol
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      // Validar que sea coordinador (o admin)
      // if (parsedUser.rol !== 'coordinador' && parsedUser.rol !== 'admin') {
      //   router.push('/dashboard');
      // }
      setUser(parsedUser);
    }
  }, [router]);

  // Cargar solicitudes
  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/solicitudes?rol=coordinador&documento=${user.documento}`);
      const data = await response.json();
      if (data.success) {
        setSolicitudes(data.solicitudes);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSolicitudes();
    }
  }, [user]);

  // Manejar acción (Aprobar/Rechazar)
  const handleAction = async (estado) => {
    if (!selectedSolicitud) return;
    setActionLoading(true);

    try {
      const response = await fetch('/api/solicitudes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSolicitud.id,
          estado: estado,
          observacion_respuesta: observacionRespuesta
        })
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar lista
        fetchSolicitudes();
        setShowModal(false);
        setSelectedSolicitud(null);
        setObservacionRespuesta('');
      } else {
        toast.error('Error: ' + (data.error || 'No se pudo actualizar la solicitud'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setActionLoading(false);
    }
  };

  // Formatear fecha
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

  // Color del badge según estado
  const getStatusColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Paginación
  const totalPages = Math.ceil(solicitudes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const solicitudesPaginadas = solicitudes.slice(startIndex, endIndex);

  if (!user) return null;

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Solicitudes</h2>
        <p className="text-gray-600">Revise y gestione las solicitudes de préstamo pendientes</p>
      </div>

      {/* Contador de resultados */}
      {!loading && solicitudes.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando <span className="font-semibold text-gray-900">{startIndex + 1}</span> a{' '}
          <span className="font-semibold text-gray-900">{Math.min(endIndex, solicitudes.length)}</span> de{' '}
          <span className="font-semibold text-gray-900">{solicitudes.length}</span> solicitudes
        </div>
      )}

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Solicitud</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sede</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="6" className="px-6 py-4 text-center">Cargando...</td>
                  </tr>
                ))
              ) : solicitudesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No hay solicitudes registradas</td>
                </tr>
              ) : (
                solicitudesPaginadas.map((solicitud) => (
                  <tr key={solicitud.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(solicitud.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {solicitud.solicitante_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {solicitud.sede_nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {solicitud.motivo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(solicitud.estado)}`}>
                        {solicitud.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedSolicitud(solicitud);
                          setShowModal(true);
                        }}
                        className="text-[#39A900] hover:text-[#2e8b00]"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {!loading && solicitudes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={solicitudes.length}
          itemsPerPage={itemsPerPage}
          itemName="solicitudes"
        />
      )}

      {/* Modal de Detalles */}
      {showModal && selectedSolicitud && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#39A900] to-[#007832] text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-bold">Detalle de Solicitud #{selectedSolicitud.id}</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Solicitante</p>
                  <p className="font-semibold">{selectedSolicitud.solicitante_nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sede</p>
                  <p className="font-semibold">{selectedSolicitud.sede_nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Inicio Préstamo</p>
                  <p className="font-semibold">{formatDate(selectedSolicitud.fecha_ini_prestamo)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Fin Préstamo</p>
                  <p className="font-semibold">{formatDate(selectedSolicitud.fecha_fin_prestamo)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Motivo</p>
                  <p className="font-semibold">{selectedSolicitud.motivo}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Destino / Ubicación Específica</p>
                  <p className="font-semibold">{selectedSolicitud.destino || 'No especificado'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Observaciones / Items Solicitados</p>
                <div className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                  {selectedSolicitud.observaciones || 'Sin observaciones'}
                </div>
              </div>

              {selectedSolicitud.estado?.toLowerCase() === 'firmada_cuentadante' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observación de Respuesta (Opcional)</label>
                  <textarea
                    value={observacionRespuesta}
                    onChange={(e) => setObservacionRespuesta(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900]"
                    rows={2}
                    placeholder="Motivo de rechazo o instrucciones adicionales..."
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cerrar
              </button>

              {selectedSolicitud.estado?.toLowerCase() === 'firmada_cuentadante' && (
                <>
                  <button
                    onClick={() => handleAction('rechazado')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAction('aprobado')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[#39A900] text-white rounded-lg hover:bg-[#2e8b00] disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
