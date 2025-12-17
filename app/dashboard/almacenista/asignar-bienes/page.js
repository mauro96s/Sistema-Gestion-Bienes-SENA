'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/app/components/Pagination';

export default function AsignarBienes() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Datos cargados desde APIs
  const [cuentadantes, setCuentadantes] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [bienesDisponibles, setBienesDisponibles] = useState([]);

  // Datos del formulario
  const [cuentadanteSeleccionado, setCuentadanteSeleccionado] = useState(null);
  const [ambienteSeleccionado, setAmbienteSeleccionado] = useState(null);
  const [bienesSeleccionados, setBienesSeleccionados] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Validar autenticación
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

  const fetchCuentadantes = async () => {
    try {
      const response = await fetch('/api/cuentadantes');
      const data = await response.json();
      if (data.success) {
        setCuentadantes(data.cuentadantes);
      } else {
        setError('Error al cargar cuentadantes');
      }
    } catch (err) {
      setError('Error de conexión al cargar cuentadantes');
    }
  };

  const fetchAmbientes = async (sedeId) => {
    try {
      const response = await fetch(`/api/ambientes?sede_id=${sedeId}`);
      const data = await response.json();
      if (data.success) {
        setAmbientes(data.ambientes);
      } else {
        setError('Error al cargar ambientes');
      }
    } catch (err) {
      setError('Error de conexión al cargar ambientes');
    }
  };

  const fetchBienesDisponibles = async () => {
    try {
      const response = await fetch('/api/bienes/sin-asignar');
      const data = await response.json();
      if (data.success) {
        setBienesDisponibles(data.bienes);
      } else {
        setError('Error al cargar bienes disponibles');
      }
    } catch (err) {
      setError('Error de conexión al cargar bienes');
    }
  };

  // Cargar cuentadantes al montar
  useEffect(() => {
    if (user) {
      fetchCuentadantes();
    }
  }, [user]);

  // Cargar bienes disponibles al montar
  useEffect(() => {
    if (user) {
      fetchBienesDisponibles();
    }
  }, [user]);

  // Cargar ambientes cuando se selecciona cuentadante
  useEffect(() => {
    setAmbienteSeleccionado(null);
    setAmbientes([]);

    if (cuentadanteSeleccionado) {
      if (cuentadanteSeleccionado.sede_id) {
        fetchAmbientes(cuentadanteSeleccionado.sede_id);
      }
    }
  }, [cuentadanteSeleccionado]);

  const handleToggleBien = (bienId) => {
    setBienesSeleccionados(prev => {
      if (prev.includes(bienId)) {
        return prev.filter(id => id !== bienId);
      } else {
        return [...prev, bienId];
      }
    });
  };

  const handleAsignar = async () => {
    if (!cuentadanteSeleccionado || !ambienteSeleccionado || bienesSeleccionados.length === 0) {
      setError('Debes completar todos los pasos antes de asignar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/asignaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cuentadante_id: cuentadanteSeleccionado.id,
          ambiente_id: ambienteSeleccionado.id,
          bienes_ids: bienesSeleccionados
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setError('');
        setTimeout(() => {
          router.push('/dashboard/almacenista/inventario');
        }, 2000);
      } else {
        setError(data.error || 'Error al realizar la asignación');
        setLoading(false);
      }
    } catch (err) {
      setError('Error de conexión al realizar la asignación');
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !cuentadanteSeleccionado) {
      setError('Debes seleccionar un cuentadante');
      return;
    }
    if (step === 2 && !ambienteSeleccionado) {
      setError('Debes seleccionar un ambiente');
      return;
    }
    if (step === 2 && bienesSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un bien');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleCancel = () => {
    if (confirm('¿Estás seguro de cancelar? Se perderán los datos ingresados.')) {
      router.push('/dashboard');
    }
  };

  // Filtrar bienes por búsqueda
  const bienesFiltrados = bienesDisponibles.filter(bien =>
    (bien.codigo && bien.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bien.nombre && bien.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bien.descripcion && bien.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bien.marca && bien.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bien.modelo && bien.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginación
  const totalPages = Math.ceil(bienesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const bienesPaginados = bienesFiltrados.slice(startIndex, endIndex);

  // Reset página cuando cambia la búsqueda
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
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
          <p className="font-semibold">¡Asignación realizada exitosamente!</p>
          <p className="text-sm">Redirigiendo al inventario...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          {/* Paso 1 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 1 ? 'bg-[#39A900] border-[#39A900] text-white' : 'bg-white border-gray-300 text-gray-500'
              }`}>
              1
            </div>
            <span className={`mt-2 text-sm ${step >= 1 ? 'text-[#39A900] font-medium' : 'text-gray-500'}`}>
              Cuentadante y Ambiente
            </span>
          </div>

          {/* Línea 1 */}
          <div className={`flex-1 h-1 self-start mt-5 ${step > 1 ? 'bg-[#39A900]' : 'bg-gray-300'}`} />

          {/* Paso 2 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 2 ? 'bg-[#39A900] border-[#39A900] text-white' : 'bg-white border-gray-300 text-gray-500'
              }`}>
              2
            </div>
            <span className={`mt-2 text-sm ${step >= 2 ? 'text-[#39A900] font-medium' : 'text-gray-500'}`}>
              Seleccionar Bienes
            </span>
          </div>

          {/* Línea 2 */}
          <div className={`flex-1 h-1 self-start mt-5 ${step > 2 ? 'bg-[#39A900]' : 'bg-gray-300'}`} />

          {/* Paso 3 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 3 ? 'bg-[#39A900] border-[#39A900] text-white' : 'bg-white border-gray-300 text-gray-500'
              }`}>
              3
            </div>
            <span className={`mt-2 text-sm ${step >= 3 ? 'text-[#39A900] font-medium' : 'text-gray-500'}`}>
              Confirmar
            </span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Paso 1: Seleccionar Cuentadante y Ambiente */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Paso 1: Seleccionar Cuentadante y Ambiente</h2>

            {/* Seleccionar Cuentadante */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Cuentadante</h3>
              <div className="space-y-4">
                {cuentadantes.map((cuentadante) => (
                  <div
                    key={cuentadante.id}
                    onClick={() => setCuentadanteSeleccionado(cuentadante)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${cuentadanteSeleccionado?.id === cuentadante.id
                      ? 'border-[#39A900] bg-green-50'
                      : 'border-gray-200 hover:border-[#39A900] hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{cuentadante.nombre}</p>
                        <p className="text-sm text-gray-600">{cuentadante.email}</p>
                      </div>
                      {cuentadante.sede_nombre && (
                        <div className="text-right text-sm text-gray-500">
                          <p>{cuentadante.sede_nombre}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {cuentadantes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay cuentadantes disponibles</p>
                )}
              </div>
            </div>

            {/* Seleccionar Ambiente */}
            {cuentadanteSeleccionado && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Ambiente</h3>

                {!cuentadanteSeleccionado.sede_id ? (
                  <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                    ⚠️ Este cuentadante no tiene una Sede asignada. No se pueden asignar bienes.
                  </div>
                ) : (
                  <>
                    {/* Buscador de ambientes */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Buscar ambiente por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
                      />
                      {searchTerm && (
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
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

                    {/* Lista de ambientes con scroll */}
                    <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                      <div className="space-y-2 p-2">
                        {ambientes
                          .filter(amb => amb.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map((ambiente) => (
                            <div
                              key={ambiente.id}
                              onClick={() => setAmbienteSeleccionado(ambiente)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition ${ambienteSeleccionado?.id === ambiente.id
                                  ? 'border-[#39A900] bg-green-50'
                                  : 'border-gray-200 hover:border-[#39A900] hover:bg-gray-50'
                                }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-gray-800">{ambiente.nombre}</p>
                                  {ambiente.sede_nombre && <p className="text-sm text-gray-600">{ambiente.sede_nombre}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        {ambientes.length === 0 && (
                          <p className="text-gray-500 text-center py-8">
                            No hay ambientes disponibles en la sede {cuentadanteSeleccionado.sede_nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Seleccionar Bienes */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Paso 2: Seleccionar Bienes</h2>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Cuentadante:</span> {cuentadanteSeleccionado?.nombre}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Ambiente:</span> {ambienteSeleccionado?.nombre}
              </p>
            </div>

            {/* Buscador */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por código, nombre, categoría o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              />
              {searchTerm && (
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
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

            {/* Tabla de bienes con scroll */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBienesSeleccionados(bienesPaginados.map(b => b.id));
                            } else {
                              setBienesSeleccionados([]);
                            }
                          }}
                          checked={bienesPaginados.length > 0 && bienesPaginados.every(b => bienesSeleccionados.includes(b.id))}
                          className="w-4 h-4 text-[#39A900] rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Placa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Marca</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Modelo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bienesPaginados.map((bien) => (
                      <tr
                        key={bien.id}
                        className={`hover:bg-green-50 transition-colors duration-150 ${bienesSeleccionados.includes(bien.id) ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={bienesSeleccionados.includes(bien.id)}
                            onChange={() => handleToggleBien(bien.id)}
                            className="w-4 h-4 text-[#39A900] rounded"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{bien.codigo}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{bien.nombre || bien.descripcion}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{bien.marca || 'N/A'}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{bien.modelo || 'N/A'}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {bien.estado_asignacion || 'Disponible'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bienesPaginados.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          {bienesDisponibles.length === 0 ? 'No hay bienes disponibles para asignar' : 'No se encontraron bienes con ese criterio de búsqueda'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-900">{startIndex + 1}</span> a{' '}
                <span className="font-semibold text-gray-900">{Math.min(endIndex, bienesFiltrados.length)}</span> de{' '}
                <span className="font-semibold text-gray-900">{bienesFiltrados.length}</span> bienes disponibles
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#39A900]">{bienesSeleccionados.length}</span> bien(es) seleccionado(s)
              </p>
            </div>

            {/* Paginación */}
            {bienesFiltrados.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={bienesFiltrados.length}
                itemsPerPage={itemsPerPage}
                itemName="bienes disponibles"
              />
            )}
          </div>
        )}

        {/* Paso 3: Confirmar */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Paso 3: Confirmar Asignación</h2>

            {/* Resumen */}
            <div className="mb-6 p-6 bg-gray-50 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-gray-600">Cuentadante</p>
                <p className="font-semibold text-gray-800">{cuentadanteSeleccionado?.nombre}</p>
                <p className="text-sm text-gray-500">{cuentadanteSeleccionado?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ambiente</p>
                <p className="font-semibold text-gray-800">{ambienteSeleccionado?.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bienes a asignar</p>
                <p className="font-semibold text-gray-800 mb-2">{bienesSeleccionados.length} bien(es)</p>
                {/* Lista con scroll para muchos bienes */}
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="space-y-2">
                    {bienesDisponibles
                      .filter(b => bienesSeleccionados.includes(b.id))
                      .map(bien => (
                        <div key={`confirm-${bien.id}`} className="flex items-start gap-2 text-sm text-gray-700 p-2 hover:bg-gray-50 rounded">
                          <span className="text-[#39A900] font-bold">•</span>
                          <div className="flex-1">
                            <p className="font-medium">{bien.placa || bien.codigo}</p>
                            <p className="text-xs text-gray-500">{bien.descripcion || bien.nombre}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Atrás
              </button>
            )}
            {step === 1 && (
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            )}
          </div>
          <div>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-[#39A900] to-[#007832] text-white rounded-lg hover:opacity-90 transition"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleAsignar}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#39A900] to-[#007832] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Asignando...
                  </span>
                ) : (
                  'Confirmar Asignación'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
