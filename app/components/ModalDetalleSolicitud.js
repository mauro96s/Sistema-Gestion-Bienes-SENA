'use client';

import { useState, useEffect } from 'react';
import { getEstadoBadge, getEstadoTexto, formatDate } from '@/lib/solicitudUtils';

export default function ModalDetalleSolicitud({
  solicitud,
  onClose,
  children // Para botones personalizados según el rol
}) {
  const [detalles, setDetalles] = useState([]);
  const [firmas, setFirmas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (solicitud) {
      fetchDetalles();
    }
  }, [solicitud]);

  const fetchDetalles = async () => {
    setLoading(true);
    try {
      const [resDetalles, resFirmas] = await Promise.all([
        fetch(`/api/solicitudes/${solicitud.id}/detalles`),
        fetch(`/api/solicitudes/${solicitud.id}/firmas`)
      ]);

      const dataDetalles = await resDetalles.json();
      const dataFirmas = await resFirmas.json();

      if (dataDetalles.success) {
        setDetalles(dataDetalles.detalles);
      }
      if (dataFirmas.success) {
        setFirmas(dataFirmas.firmas);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFirmaEstado = (firma) => {
    if (!firma) return { text: '⏳ Pendiente', color: 'text-gray-400' };
    if (firma.firma) return { text: '✓ Firmado', color: 'text-green-600' };
    return { text: '✗ Rechazado', color: 'text-red-600' };
  };

  if (!solicitud) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header - Fijo */}
        <div className="bg-gradient-to-r from-[#39A900] to-[#007832] text-white px-8 py-5 flex justify-between items-center rounded-t-2xl flex-shrink-0">
          <div>
            <h3 className="text-2xl font-bold">Solicitud #{solicitud.id}</h3>
            <p className="text-sm text-white/80 mt-1">{solicitud.solicitante_nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 hover:rotate-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#39A900] border-t-transparent"></div>
            <p className="text-gray-500 text-sm">Cargando detalles...</p>
          </div>
        ) : (
          <>
            {/* Contenido - Con scroll */}
            <div className="p-8 space-y-8 overflow-y-auto flex-1">
              {/* Información General */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-[#39A900] p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Información General</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sede</p>
                    <p className="text-base font-semibold text-gray-900">{solicitud.sede_nombre || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Estado</p>
                    <span className={`inline-block px-4 py-2 text-sm font-bold rounded-lg ${getEstadoBadge(solicitud.estado)}`}>
                      {getEstadoTexto(solicitud.estado)}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha Inicio Préstamo</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(solicitud.fecha_ini_prestamo)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha Fin Préstamo</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(solicitud.fecha_fin_prestamo)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Motivo</p>
                    <p className="text-base font-semibold text-gray-900">{solicitud.motivo}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Destino</p>
                    <p className="text-base font-semibold text-gray-900">{solicitud.destino || 'No especificado'}</p>
                  </div>
                  {solicitud.observaciones && (
                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Observaciones</p>
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{solicitud.observaciones}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de Firmas */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Estado de Firmas</h4>
                </div>
                <div className="space-y-3">
                  {['cuentadante', 'coordinador', 'vigilante_salida', 'vigilante_entrada'].map((rol) => {
                    const firma = firmas.find(f => f.rol_usuario === rol);
                    const estado = getFirmaEstado(firma);
                    const nombreRol = {
                      'cuentadante': 'Cuentadante',
                      'coordinador': 'Coordinador (Aprobación Final)',
                      'vigilante_salida': 'Vigilante - Autorización de Salida',
                      'vigilante_entrada': 'Vigilante - Registro de Entrada'
                    }[rol];

                    return (
                      <div key={rol} className="flex flex-col bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">{nombreRol}</span>
                          <span className={`text-sm font-bold ${estado.color}`}>{estado.text}</span>
                        </div>
                        {firma && firma.fecha_firmado && (
                          <div className="mt-1 text-xs text-gray-500">
                            Firmado el: {new Date(firma.fecha_firmado).toLocaleString('es-CO')}
                          </div>
                        )}
                        {firma && firma.observacion && (
                          <div className="mt-2 text-sm text-gray-700 italic border-t border-gray-200 pt-2">
                            Nota: {firma.observacion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bienes Solicitados - Tabla */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-800">Bienes Solicitados</h4>
                  </div>
                  {detalles.length > 0 && (
                    <p className="text-xs text-gray-600">
                      Cuentadante: <span className="font-semibold">{detalles[0].cuentadante_nombre}</span>
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Placa</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Serial</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Marca</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detalles.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              <p className="text-gray-500 font-medium">No hay bienes en esta solicitud</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        detalles.map((detalle, idx) => (
                          <tr key={idx} className="hover:bg-purple-50 transition-colors duration-150">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{detalle.placa}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{detalle.serial || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{detalle.descripcion}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{detalle.marca || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer con botones personalizados - Fijo */}
            <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold"
              >
                Cerrar
              </button>
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
