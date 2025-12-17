'use client';

import { getEstadoBadge, getEstadoTexto, formatDate } from '@/lib/solicitudUtils';
import Pagination from '@/app/components/Pagination';

/**
 * Componente reutilizable para mostrar tabla de solicitudes
 * 
 * @param {Array} solicitudes - Array de solicitudes a mostrar
 * @param {boolean} loading - Estado de carga
 * @param {Function} onVerDetalles - Callback al hacer clic en "Ver Detalles"
 * @param {Function} onAccionExtra - Callback opcional para acción extra (ej: cancelar)
 * @param {string} mensajeVacio - Mensaje cuando no hay solicitudes
 * @param {boolean} mostrarSolicitante - Mostrar columna de solicitante (para admin/coordinador/cuentadante)
 * @param {boolean} mostrarAccionExtra - Mostrar botón de acción extra
 * @param {Function} textoAccionExtra - Función que retorna el texto del botón extra según la solicitud
 * @param {Function} mostrarBotonExtra - Función que determina si mostrar el botón extra
 * @param {boolean} mostrarFiltros - Mostrar barra de filtros (buscador y selector de estado)
 * @param {string} searchTerm - Término de búsqueda
 * @param {Function} onSearchChange - Callback cuando cambia el término de búsqueda
 * @param {string} estadoFiltro - Estado seleccionado para filtrar
 * @param {Function} onEstadoChange - Callback cuando cambia el filtro de estado
 * @param {Array} estadosPermitidos - Array de estados permitidos para el filtro (opcional)
 * @param {number} currentPage - Página actual (opcional, por defecto 1)
 * @param {Function} onPageChange - Callback cuando cambia la página
 * @param {number} itemsPerPage - Elementos por página (opcional, por defecto 10)
 */
export default function TablaSolicitudes({
  solicitudes = [],
  loading = false,
  onVerDetalles,
  onAccionExtra,
  mensajeVacio = 'No hay solicitudes registradas',
  mostrarSolicitante = false,
  mostrarAccionExtra = false,
  textoAccionExtra = () => 'Acción',
  mostrarBotonExtra = () => false,
  mostrarFiltros = false,
  searchTerm = '',
  onSearchChange = () => {},
  estadoFiltro = '',
  onEstadoChange = () => {},
  estadosPermitidos = null,
  currentPage = 1,
  onPageChange = () => {},
  itemsPerPage = 10
}) {

  // Paginación
  const totalPages = Math.ceil(solicitudes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const solicitudesPaginadas = solicitudes.slice(startIndex, endIndex);

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#39A900] border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  if (solicitudes.length === 0 && !mostrarFiltros) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">{mensajeVacio}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Buscador */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar por ID, cuentadante o destino..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Selector de Estado */}
            <div className="w-full md:w-64">
              <select
                value={estadoFiltro}
                onChange={(e) => onEstadoChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="">Todos los estados</option>
                {estadosPermitidos ? (
                  // Estados específicos para el rol
                  estadosPermitidos.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))
                ) : (
                  // Estados por defecto (todos)
                  <>
                    <option value="pendiente">Pendiente</option>
                    <option value="firmada_cuentadante">Firmada por Cuentadante</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="en_prestamo">En Préstamo</option>
                    <option value="devuelto">Devuelto</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="cancelada">Cancelada</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Información de filtros y botón limpiar */}
          {!loading && (searchTerm || estadoFiltro) && (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {searchTerm && (
                  <span>Búsqueda: <span className="font-semibold text-gray-900">&quot;{searchTerm}&quot;</span></span>
                )}
                {searchTerm && estadoFiltro && <span className="mx-2">•</span>}
                {estadoFiltro && (
                  <span>Estado: <span className="font-semibold text-gray-900">{estadoFiltro}</span></span>
                )}
              </div>
              <button
                onClick={() => {
                  onSearchChange('');
                  onEstadoChange('');
                }}
                className="text-sm text-[#39A900] hover:text-[#007832] font-medium flex items-center gap-1 transition-colors duration-150 ml-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      {solicitudes.length === 0 && mostrarFiltros ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No se encontraron solicitudes con los filtros aplicados</p>
            <button
              onClick={() => {
                onSearchChange('');
                onEstadoChange('');
              }}
              className="mt-2 text-sm text-[#39A900] hover:text-[#007832] font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                ID
              </th>
              {mostrarSolicitante && (
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Solicitante
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Fechas Préstamo
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Destino
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Firmas
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {solicitudesPaginadas.map((solicitud) => (
              <tr key={solicitud.id} className="hover:bg-green-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-[#39A900] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">#{solicitud.id}</span>
                    </div>
                  </div>
                </td>
                {mostrarSolicitante && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="ml-2 text-sm text-gray-900">{solicitud.solicitante_nombre}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div>{formatFecha(solicitud.fecha_ini_prestamo)}</div>
                      <div className="text-xs text-gray-500">
                        hasta {formatFecha(solicitud.fecha_fin_prestamo)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {solicitud.destino || 'No especificado'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-lg ${getEstadoBadge(solicitud.estado)}`}>
                    {getEstadoTexto(solicitud.estado)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-bold text-xs">{solicitud.firmas_completadas || 0}</span>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">/4</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onVerDetalles(solicitud)}
                      className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-150 text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </button>
                    {mostrarAccionExtra && mostrarBotonExtra(solicitud) && (
                      <button
                        onClick={() => onAccionExtra(solicitud)}
                        className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-150 text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {textoAccionExtra(solicitud)}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )}

      {/* Paginación */}
      {!loading && solicitudes.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={solicitudes.length}
          itemsPerPage={itemsPerPage}
          itemName="solicitudes"
        />
      )}
    </div>
  );
}
