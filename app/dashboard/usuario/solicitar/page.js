'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PackageIcon, PlusIcon, TrashIcon, CalendarIcon } from '@/app/components/Icons';
import { useToast } from '@/app/components/Toast';
import { Button } from '@/app/components/Button';
import { useConfirm } from '@/app/components/ConfirmDialog';

export default function SolicitarBienes() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para datos
  const [sedes, setSedes] = useState([]);
  const [bienes, setBienes] = useState([]);
  const [bienesFiltrados, setBienesFiltrados] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');

  // Estado del carrito y filtros
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCuentadante, setFiltroCuentadante] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    fecha_ini_prestamo: '',
    fecha_fin_prestamo: '',
    destino: '',
    motivo: '',
    observaciones: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      setUser(JSON.parse(userData));
    }

    // Establecer fecha/hora actual del sistema al cargar
    const now = new Date();
    // Ajuste simple para zona horaria local en input datetime-local
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormData(prev => ({
      ...prev,
      fecha_ini_prestamo: now.toISOString().slice(0, 16)
    }));

  }, [router]);

  // Cargar lista de Sedes (Metadata)
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const res = await fetch('/api/sedes');
        const data = await res.json();
        if (data.success) setSedes(data.sedes);
      } catch (err) {
        console.error('Error cargando sedes:', err);
      }
    };
    if (user) fetchSedes();
  }, [user]);

  // Cargar Bienes cuando cambia la Sede Seleccionada
  useEffect(() => {
    if (!sedeSeleccionada) {
      setBienes([]);
      setBienesFiltrados([]);
      return;
    }

    const fetchBienes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bienes/disponibles?sede_id=${sedeSeleccionada}`);
        const data = await res.json();
        if (data.success) {
          setBienes(data.bienes);
          setBienesFiltrados(data.bienes);
          // Limpiar carrito si se cambia de sede (opcional, pero recomendable para evitar mezclas)
          if (carrito.length > 0) {
            // Podríamos avisar, pero por ahora limpiamos para consistencia
            setCarrito([]);
            toast.info('Se ha limpiado el carrito al cambiar de sede');
          }
        }
      } catch (err) {
        console.error('Error cargando bienes:', err);
        toast.error('Error al cargar bienes de la sede');
      } finally {
        setLoading(false);
      }
    };

    fetchBienes();
  }, [sedeSeleccionada]);

  // Filtrar bienes
  useEffect(() => {
    let filtered = bienes;

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.cuentadante_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.ambiente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtroCuentadante) {
      filtered = filtered.filter(b => b.cuentadante_documento === filtroCuentadante);
    }

    setBienesFiltrados(filtered);
  }, [searchTerm, filtroCuentadante, bienes]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const agregarAlCarrito = (bien) => {
    if (carrito.find(b => b.asignacion_id === bien.asignacion_id)) {
      toast.warning('Este bien ya está en tu carrito');
      return;
    }
    setCarrito(prev => [...prev, bien]);
    toast.success(`${bien.placa} agregado`);
  };

  const eliminarDelCarrito = (asignacionId) => {
    setCarrito(prev => prev.filter(b => b.asignacion_id !== asignacionId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (carrito.length === 0) {
      toast.warning('Debes agregar al menos un bien al carrito');
      return;
    }

    if (!sedeSeleccionada || !formData.fecha_ini_prestamo || !formData.fecha_fin_prestamo || !formData.destino || !formData.motivo) {
      toast.warning('Por favor completa todos los campos obligatorios');
      return;
    }

    const confirmed = await confirm(`¿Enviar solicitud con ${carrito.length} bien(es)?`, {
      title: 'Confirmar envío',
      confirmText: 'Enviar',
      type: 'info'
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sede_id: sedeSeleccionada, // La sede viene del selector principal
          doc_persona: user.documento,
          bienes: carrito.map(b => b.asignacion_id)
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${data.solicitudesCreadas} solicitud(es) creada(s) exitosamente`);
        router.push('/dashboard/usuario/solicitudes');
      } else {
        toast.error('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  // Lista única de cuentadantes para filtro
  const cuentadantes = [...new Map(bienes.map(b => [b.cuentadante_documento, {
    documento: b.cuentadante_documento,
    nombre: b.cuentadante_nombre
  }])).values()];

  // Agrupar carrito
  const carritoAgrupado = carrito.reduce((acc, bien) => {
    const key = bien.cuentadante_documento;
    if (!acc[key]) {
      acc[key] = { cuentadante: bien.cuentadante_nombre, bienes: [] };
    }
    acc[key].bienes.push(bien);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Solicitar Bienes en Préstamo</h1>
        <p className="text-gray-600">Selecciona la sede, los bienes y completa la información</p>
      </div>

      {/* SELECTOR DE SEDE PRINCIPAL */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          1. Selecciona la Sede donde se encuentran los bienes:
        </label>
        <select
          value={sedeSeleccionada}
          onChange={(e) => setSedeSeleccionada(e.target.value)}
          className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] text-lg"
        >
          <option value="">-- Seleccionar Sede --</option>
          {sedes.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {sedeSeleccionada ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">

          {/* COLUMNA IZQUIERDA: Bienes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Selecciona los Bienes</h2>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar placa, descripción..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900]"
                  />
                  <select
                    value={filtroCuentadante}
                    onChange={(e) => setFiltroCuentadante(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Todos los cuentadantes</option>
                    {cuentadantes.map(c => (
                      <option key={c.documento} value={c.documento}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Información de filtros y botón limpiar */}
                {(searchTerm || filtroCuentadante) && (
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                    <div>
                      {searchTerm && (
                        <span>Búsqueda: <span className="font-semibold text-gray-900">"{searchTerm}"</span></span>
                      )}
                      {searchTerm && filtroCuentadante && <span className="mx-2">•</span>}
                      {filtroCuentadante && (
                        <span>Cuentadante: <span className="font-semibold text-gray-900">{cuentadantes.find(c => c.documento === filtroCuentadante)?.nombre}</span></span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFiltroCuentadante('');
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

              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ambiente</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bienesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          {loading ? 'Cargando bienes...' : 'No hay bienes disponibles en esta sede'}
                        </td>
                      </tr>
                    ) : (
                      bienesFiltrados.map(bien => (
                        <tr key={bien.asignacion_id} className="hover:bg-green-50 transition-colors duration-150">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{bien.placa}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{bien.descripcion}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{bien.ambiente_nombre}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => agregarAlCarrito(bien)}
                              disabled={carrito.find(b => b.asignacion_id === bien.asignacion_id)}
                              className="p-2 bg-[#39A900] text-white rounded-lg hover:bg-[#007832] transition disabled:opacity-50"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Carrito */}
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-[#39A900]">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <PackageIcon className="w-5 h-5 text-[#39A900]" />
                  Bienes Seleccionados ({carrito.length})
                </h2>
              </div>
              <div className="p-4 max-h-[300px] overflow-y-auto">
                {carrito.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">Tu carrito está vacío</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(carritoAgrupado).map(([doc, grupo]) => (
                      <div key={doc} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-3 py-1 border-b border-gray-200">
                          <p className="text-xs font-bold text-[#39A900]">{grupo.cuentadante}</p>
                        </div>
                        {grupo.bienes.map(bien => (
                          <div key={bien.asignacion_id} className="flex justify-between items-center p-2 hover:bg-green-50 transition-colors duration-150">
                            <span className="text-sm text-gray-700">{bien.placa} - {bien.descripcion}</span>
                            <button onClick={() => eliminarDelCarrito(bien.asignacion_id)} className="text-red-500 hover:text-red-700">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Formulario */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#39A900]" />
                3. Datos del Préstamo
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
                  <input
                    type="text"
                    name="destino"
                    value={formData.destino}
                    onChange={handleInputChange}
                    placeholder="Ej: Salón 101, Auditorio..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                      type="datetime-local"
                      name="fecha_ini_prestamo"
                      value={formData.fecha_ini_prestamo}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Devolución Estimada *</label>
                    <input
                      type="date"
                      name="fecha_fin_prestamo"
                      value={formData.fecha_fin_prestamo}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900]"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                  <textarea
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="¿Para qué se usarán?"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Opcional..."
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || carrito.length === 0}
                    className="w-full shadow-md"
                  >
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </div>

              </form>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">Selecciona una sede arriba para ver los bienes disponibles.</p>
        </div>
      )}

    </div>
  );
}
