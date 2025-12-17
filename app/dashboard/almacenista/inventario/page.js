'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreatableSelect from 'react-select/creatable';
import { Button } from '@/app/components/Button';
import { useToast } from '@/app/components/Toast';
import Pagination from '@/app/components/Pagination';

export default function InventarioBienes() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();
  const [bienes, setBienes] = useState([]);
  const [itemsPerPage] = useState(10); // Fixed usage
  const [marcas, setMarcas] = useState([]); // List of brands for editing

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBien, setSelectedBien] = useState(null);
  const [editingBien, setEditingBien] = useState(null); // Form data for editing

  // Validar autenticación
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      // Validar rol si es necesario
      setUser(parsedUser);
    }
  }, [router]);

  // Obtener bienes de la API
  useEffect(() => {
    const fetchBienes = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);

        const response = await fetch(`/api/bienes?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setBienes(data.bienes);
        } else {
          setError(data.error || 'Error al cargar los bienes');
        }
      } catch (err) {
        console.error('Error al obtener bienes:', err);
        setError('Error de conexión al obtener los bienes');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBienes();
    }
  }, [user, searchTerm]);

  // Obtener Marcas para el formulario de edición
  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const res = await fetch('/api/marcas');
        const data = await res.json();
        if (data.success) {
          setMarcas(data.marcas.map(m => ({ value: m.id, label: m.nombre })));
        }
      } catch (e) { console.error(e); }
    };
    if (user) fetchMarcas();
  }, [user]);

  const handleEditClick = (bien) => {
    // Preparar datos para editar
    // Encontrar marca_id si no viene directo (nuestro query trae marca nombre, pero necesitamos ID para editar...
    // El endpoint GET bienes actual trae: marca (nombre). NO trae marca_id explícito en la columna.
    // Necesitamos actualizar el GET para traer marca_id o deducirlo.
    // Voy a asumir que en el select podemos buscar por label si no tenemos ID, o mejor:
    // **CRITICAL**: The GET endpoint currently joins `marcas` but selects `m.nombre as marca`. It does NOT select `m.id` or `b.marca_id`.
    // I need to update the GET endpoint to return `marca_id` too? 
    // Wait, let's check `route.js` again. 
    // It selects `b.id`, `b.placa`... `m.nombre as marca`.
    // It does not select `b.marca_id`. 
    // I can assume for now we use the `marca` string to find the ID in the loaded `marcas` list.

    // ... logic below ...
    // Map existing brand name to ID from `marcas` list
    const marcaOption = marcas.find(m => m.label === bien.marca);

    setEditingBien({
      ...bien,
      marca_id: marcaOption ? marcaOption.value : null,
      marca_label: bien.marca, // Helper
      costo: parseFloat(bien.costo) || 0,
      vida_util: bien.vida_util || 0
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingBien) return;

    try {
      const res = await fetch('/api/bienes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBien)
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Bien actualizado correctamente');
        setShowEditModal(false);
        setEditingBien(null);
        // Recargar datos (o actualizar localmente)
        // Para simplificar, recargamos con el filtro actual
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        const refreshRes = await fetch(`/api/bienes?${params.toString()}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setBienes(refreshData.bienes);

      } else {
        toast.error(data.error || 'Error al actualizar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión');
    }
  };

  // Volver al dashboard
  const handleBack = () => {
    router.push('/dashboard');
  };

  // Paginación
  const totalPages = Math.ceil(bienes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBienes = bienes.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear estado para mostrar texto limpio
  const formatStatus = (estado) => {
    if (!estado) return 'N/A';
    return estado.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Color del badge según estado
  const getStatusColor = (estado) => {
    const estadoLower = estado?.toLowerCase();

    // Buen estado -> Verde
    if (estadoLower === 'buen_estado' || estadoLower === 'buen estado') {
      return 'bg-green-100 text-green-800 border border-green-200';
    }

    // En mantenimiento -> Amarillo
    if (estadoLower === 'en_mantenimiento' || estadoLower === 'en mantenimiento') {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }

    // Mal estado / Dañado / Dado de baja -> Rojo
    if (estadoLower === 'mal_estado' || estadoLower === 'mal estado' || estadoLower === 'dañado' || estadoLower === 'dado_de_baja' || estadoLower === 'en_reparacion') {
      return 'bg-red-100 text-red-800 border border-red-200';
    }

    return 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Título y contador */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventario Completo</h2>
          {!loading && !error && (
            <p className="text-gray-600">
              Mostrando {currentBienes.length} de {bienes.length} bienes
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/dashboard/almacenista/registrar')}
          className="bg-[#39A900] text-white px-4 py-2 rounded-lg hover:bg-[#2e8b00] transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Bien
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa, descripción, marca, modelo o serial..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition-all"
          />
        </div>

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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Placa
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Marca
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Modelo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Serial
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#39A900] border-t-transparent"></div>
                      <p className="text-gray-500 text-sm">Cargando bienes...</p>
                    </div>
                  </td>
                </tr>
              ) : currentBienes.length > 0 ? (
                currentBienes.map((bien) => (
                  <tr key={bien.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#39A900] rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">{bien.placa}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate" title={bien.descripcion}>
                        {bien.descripcion}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bien.marca || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bien.modelo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {bien.serial || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-lg ${getStatusColor(bien.estado)}`}>
                        {formatStatus(bien.estado)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {bien.responsable ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="ml-2 text-sm text-gray-900">{bien.responsable}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          setSelectedBien(bien);
                          setShowModal(true);
                        }}
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
                        onClick={() => handleEditClick(bien)}
                        className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors duration-150 text-sm font-medium ml-2"
                        title="Editar bien"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-medium">No se encontraron bienes con los filtros seleccionados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={bienes.length}
          itemsPerPage={itemsPerPage}
          itemName="bienes"
        />
      </div>

      {/* Modal de Detalles del Bien */}
      {showModal && selectedBien && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in">
            {/* Header del Modal - Fijo */}
            <div className="bg-gradient-to-r from-[#39A900] to-[#007832] text-white px-8 py-5 rounded-t-2xl flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-2xl font-bold">Detalles del Bien</h3>
                <p className="text-sm text-white/80 mt-1">Placa: {selectedBien.placa}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedBien(null);
                }}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 hover:rotate-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del Modal - Con Scroll */}
            <div className="p-8 space-y-8 overflow-y-auto flex-1">
              {/* Información Principal */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-[#39A900] p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Información Principal</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Placa</p>
                    <p className="text-lg font-bold text-gray-900">{selectedBien.placa}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Estado</p>
                    <span className={`px-4 py-2 inline-flex text-sm font-bold rounded-lg ${getStatusColor(selectedBien.estado)}`}>
                      {formatStatus(selectedBien.estado)}
                    </span>
                  </div>
                  <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Descripción</p>
                    <p className="text-base text-gray-900 leading-relaxed">{selectedBien.descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Especificaciones Técnicas */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Especificaciones Técnicas</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Marca</p>
                    <p className="text-base font-semibold text-gray-900">{selectedBien.marca || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Modelo</p>
                    <p className="text-base font-semibold text-gray-900">{selectedBien.modelo || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Serial</p>
                    <p className="text-base font-semibold text-gray-900">{selectedBien.serial || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vida Útil</p>
                    <p className="text-base font-semibold text-gray-900">{selectedBien.vida_util ? `${selectedBien.vida_util} años` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Información Financiera */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-amber-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Información Financiera</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Costo</p>
                    <p className="text-2xl font-bold text-[#39A900]">
                      {formatCurrency(Number(selectedBien.costo))}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de Compra</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(selectedBien.fecha_compra)}</p>
                  </div>
                </div>
              </div>

              {/* Asignación Actual */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Asignación Actual</h4>
                </div>
                {selectedBien.responsable ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Responsable</p>
                      <p className="text-base font-semibold text-gray-900">{selectedBien.responsable}</p>
                    </div>
                    {selectedBien.ambiente && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ambiente</p>
                        <p className="text-base font-semibold text-gray-900">{selectedBien.ambiente}</p>
                      </div>
                    )}
                    {selectedBien.sede && (
                      <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sede</p>
                        <p className="text-base font-semibold text-gray-900">{selectedBien.sede}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-500 font-medium">Este bien no está asignado a ningún cuentadante</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal - Fijo */}
            <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl flex justify-between items-center border-t border-gray-200 flex-shrink-0">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Última actualización:</span> {formatDate(selectedBien.fecha_compra)}
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedBien(null);
                }}
                className="px-8 py-3 bg-gradient-to-r from-[#39A900] to-[#007832] text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && editingBien && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-yellow-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold">Editar Bien: {editingBien.placa}</h3>
              <button onClick={() => setShowEditModal(false)} className="hover:bg-white/20 rounded-full p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    rows="2"
                    value={editingBien.descripcion}
                    onChange={e => setEditingBien({ ...editingBien, descripcion: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Marca</label>
                  <CreatableSelect
                    options={marcas}
                    value={marcas.find(m => m.value === editingBien.marca_id) || { label: editingBien.marca_label, value: editingBien.marca_id }}
                    onChange={(opt) => setEditingBien({ ...editingBien, marca_id: opt?.value })}
                    className="mt-1"
                    placeholder="Seleccionar..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Modelo</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    value={editingBien.modelo || ''}
                    onChange={e => setEditingBien({ ...editingBien, modelo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    value={editingBien.serial || ''}
                    onChange={e => setEditingBien({ ...editingBien, serial: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Costo</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    value={editingBien.costo}
                    onChange={e => setEditingBien({ ...editingBien, costo: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Vida Útil (años)</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    value={editingBien.vida_util || ''}
                    onChange={e => setEditingBien({ ...editingBien, vida_util: e.target.value })}
                  />
                </div>

                <div className="col-span-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <label className="block text-sm font-bold text-yellow-800 mb-2">Estado Actual</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                    value={editingBien.estado}
                    onChange={e => setEditingBien({ ...editingBien, estado: e.target.value })}
                  >
                    <option value="buen_estado">Buen estado</option>
                    <option value="en_mantenimiento">Mantenimiento</option>
                    <option value="dañado">Dañado</option>
                  </select>
                  <p className="text-xs text-yellow-700 mt-1">
                    ⚠️ Cambiar el estado registrará un historial de novedades.
                  </p>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
