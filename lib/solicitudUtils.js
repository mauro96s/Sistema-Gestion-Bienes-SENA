/**
 * Utilidades compartidas para el manejo de solicitudes
 */

/**
 * Obtiene las clases CSS para el badge de estado
 */
export const getEstadoBadge = (estado) => {
  const estados = {
    'pendiente': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    'firmada_cuentadante': 'bg-blue-100 text-blue-800 border border-blue-300',
    'aprobada': 'bg-green-100 text-green-800 border border-green-300',
    'en_prestamo': 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    'devuelto': 'bg-green-50 text-green-700 border border-green-200',
    'rechazada': 'bg-red-100 text-red-800 border border-red-300',
    'cancelada': 'bg-gray-200 text-gray-800 border border-gray-400'
  };
  return estados[estado?.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-300';
};

/**
 * Obtiene el texto legible del estado
 */
export const getEstadoTexto = (estado) => {
  const textos = {
    'pendiente': 'Pendiente',
    'firmada_cuentadante': 'Firmada por Cuentadante',
    'aprobada': 'Aprobada',
    'en_prestamo': 'En Préstamo',
    'devuelto': 'Devuelto',
    'rechazada': 'Rechazada',
    'cancelada': 'Cancelada'
  };
  return textos[estado?.toLowerCase()] || estado;
};

/**
 * Formatea una fecha a formato legible en español
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Filtra solicitudes por término de búsqueda y estado
 * @param {Array} solicitudes - Array de solicitudes a filtrar
 * @param {string} searchTerm - Término de búsqueda (ID, cuentadante, destino)
 * @param {string} estadoFiltro - Estado para filtrar
 * @returns {Array} Solicitudes filtradas
 */
export const filtrarSolicitudes = (solicitudes, searchTerm, estadoFiltro) => {
  let resultado = [...solicitudes];

  // Filtrar por búsqueda (ID, cuentadante, destino, solicitante)
  if (searchTerm) {
    const termino = searchTerm.toLowerCase();
    resultado = resultado.filter(sol =>
      sol.id.toString().includes(searchTerm) ||
      sol.destino?.toLowerCase().includes(termino) ||
      sol.cuentadante_nombre?.toLowerCase().includes(termino) ||
      sol.solicitante_nombre?.toLowerCase().includes(termino) ||
      sol.motivo?.toLowerCase().includes(termino)
    );
  }

  // Filtrar por estado
  if (estadoFiltro) {
    resultado = resultado.filter(sol => sol.estado === estadoFiltro);
  }

  return resultado;
};
