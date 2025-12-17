'use client';

/**
 * Componente de paginación reutilizable y estandarizado
 * 
 * @param {number} currentPage - Página actual
 * @param {number} totalPages - Total de páginas
 * @param {Function} onPageChange - Callback cuando cambia la página
 * @param {number} totalItems - Total de elementos (opcional)
 * @param {number} itemsPerPage - Elementos por página (opcional)
 * @param {string} itemName - Nombre del elemento (ej: "usuarios", "solicitudes")
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  itemName = 'elementos'
}) {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mt-6">
      <div className="flex items-center justify-between">
        {/* Información de página */}
        <div className="text-sm text-gray-600">
          {totalItems > 0 ? (
            <>
              Mostrando <span className="font-semibold text-gray-900">{startIndex + 1}</span> a{' '}
              <span className="font-semibold text-gray-900">{endIndex}</span> de{' '}
              <span className="font-semibold text-gray-900">{totalItems}</span> {itemName}
            </>
          ) : (
            <>
              Página <span className="font-semibold text-gray-900">{currentPage}</span> de{' '}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </>
          )}
        </div>

        {/* Controles de navegación */}
        <div className="flex items-center gap-2">
          {/* Botón Anterior */}
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Anterior
          </button>
          
          {/* Números de página */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    currentPage === pageNum
                      ? 'bg-[#39A900] text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Botón Siguiente */}
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}