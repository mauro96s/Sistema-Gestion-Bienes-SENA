'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { FileIcon, CheckCircleIcon, AlertIcon, PackageIcon } from '@/app/components/Icons';

export default function SolicitudesCuentadante() {
  const router = useRouter();
  const toast = useToast();
  const { confirm, prompt } = useConfirm();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [firmas, setFirmas] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

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

  useEffect(() => {
    const fetchSolicitudes = async () => {
      if (!user) return;

      try {
        // Obtener solicitudes que incluyen bienes del cuentadante
        const res = await fetch(`/api/solicitudes/cuentadante?documento=${user.documento}`);
        const data = await res.json();
        if (data.success) setSolicitudes(data.solicitudes);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, [user]);

  const abrirDetalle = async (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalAbierto(true);
    setCargandoDetalles(true);

    try {
      const res = await fetch(`/api/solicitudes/${solicitud.id}/detalles`);
      const data = await res.json();
      if (data.success) {
        setDetalles(data.detalles);
        setFirmas(data.firmas || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargandoDetalles(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSeleccionada(null);
    setDetalles([]);
    setFirmas([]);
  };

  const handleFirmar = async (aprobar) => {
    const observacion = await prompt(
      aprobar ? 'Observación (opcional):' : 'Motivo del rechazo:',
      {
        title: aprobar ? 'Aprobar solicitud' : 'Rechazar solicitud',
        placeholder: aprobar ? 'Ingresa una observación...' : 'Debes indicar el motivo...'
      }
    );

    if (!aprobar && !observacion) {
      toast.warning('Debes indicar el motivo del rechazo');
      return;
    }

    const confirmed = await confirm(`¿Confirmar ${aprobar ? 'aprobación' : 'rechazo'}?`, {
      title: aprobar ? 'Aprobar solicitud' : 'Rechazar solicitud',
      confirmText: aprobar ? 'Aprobar' : 'Rechazar',
      type: aprobar ? 'success' : 'danger'
    });
    if (!confirmed) return;

    setProcesando(true);
    try {
      const res = await fetch(`/api/solicitudes/${solicitudSeleccionada.id}/firmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: 'cuentadante',
          documento: user.documento,
          firma: aprobar,
          observacion
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(aprobar ? 'Solicitud aprobada exitosamente' : 'Solicitud rechazada');
        setSolicitudes(prev => prev.filter(s => s.id !== solicitudSeleccionada.id));
        cerrarModal();
      } else {
        toast.error(data.error || 'Error al procesar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setProcesando(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes Pendientes</h1>
        <p className="text-gray-600">Solicitudes donde te piden bienes a tu cargo</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39A900] mx-auto"></div>
            <p className="text-gray-500 mt-3">Cargando...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tienes solicitudes pendientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Solicitante</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Motivo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fechas</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Items</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {solicitudes.map((sol) => (
                  <tr key={sol.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{sol.solicitante_nombre}</div>
                      <div className="text-xs text-gray-500">{sol.solicitante_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sol.motivo}</div>
                      <div className="text-xs text-gray-500">Destino: {sol.destino}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {new Date(sol.fecha_ini_prestamo).toLocaleDateString('es-CO')}
                      </div>
                      <div className="text-xs text-gray-500">
                        hasta {new Date(sol.fecha_fin_prestamo).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {sol.items_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => abrirDetalle(sol)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#39A900] to-[#007832] text-white">
              <h2 className="text-xl font-bold">Detalle de Solicitud</h2>
              <p className="text-sm opacity-90">Solicitante: {solicitudSeleccionada?.solicitante_nombre}</p>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Motivo</p>
                  <p className="font-medium text-gray-900">{solicitudSeleccionada?.motivo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Destino</p>
                  <p className="font-medium text-gray-900">{solicitudSeleccionada?.destino}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Desde</p>
                  <p className="font-medium text-gray-900">
                    {new Date(solicitudSeleccionada?.fecha_ini_prestamo).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Hasta</p>
                  <p className="font-medium text-gray-900">
                    {new Date(solicitudSeleccionada?.fecha_fin_prestamo).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Estado de Aprobaciones</h3>
                <div className="space-y-2">
                  {['cuentadante_responsable', 'coordinador'].map((rol) => {
                    const firma = firmas.find(f => f.rol_firmante === rol);
                    const nombreRol = rol === 'cuentadante_responsable' ? 'Cuentadante' : 'Coordinador (Aprobación Final)';

                    return (
                      <div key={rol} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{nombreRol}</span>
                        {!firma ? (
                          <span className="flex items-center gap-2 text-gray-500 text-sm">
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full animate-pulse"></div>
                            Pendiente
                          </span>
                        ) : firma.estado === 'aprobado' ? (
                          <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            Aprobado
                            {firma.firmante_nombre && <span className="text-xs text-gray-500">({firma.firmante_nombre})</span>}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-600 text-sm font-medium">
                            <AlertIcon className="w-5 h-5" />
                            Rechazado
                            {firma.observaciones && <span className="text-xs text-gray-500" title={firma.observaciones}>📝</span>}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-[#39A900]" />
                Bienes Solicitados
              </h3>

              {cargandoDetalles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39A900] mx-auto"></div>
                </div>
              ) : detalles.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No hay bienes en esta solicitud</p>
              ) : (
                <ul className="space-y-3">
                  {detalles.map((item, idx) => (
                    <li key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.placa}</p>
                          <p className="text-sm text-gray-600">{item.descripcion || 'Sin descripción'}</p>
                          <p className="text-xs text-gray-500 mt-1">Cuentadante: {item.cuentadante_nombre}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={cerrarModal}
                disabled={procesando}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleFirmar(false)}
                disabled={procesando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <AlertIcon className="w-4 h-4" />
                Rechazar
              </button>
              <button
                onClick={() => handleFirmar(true)}
                disabled={procesando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Aprobar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
