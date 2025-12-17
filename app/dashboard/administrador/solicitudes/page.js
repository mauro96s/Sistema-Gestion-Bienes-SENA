'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { filtrarSolicitudes } from '@/lib/solicitudUtils';

export default function SolicitudesAdministrador() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [sedes, setSedes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.rol !== 'administrador') {
        router.push('/dashboard');
      }
      setUser(parsedUser);
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchSolicitudes();
      fetchSedes();
    }
  }, [user]);

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch('/api/solicitudes?rol=administrador');
      const data = await res.json();
      if (data.success) {
        setSolicitudes(data.solicitudes);
        setSolicitudesFiltradas(data.solicitudes);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSedes = async () => {
    try {
      const res = await fetch('/api/sedes');
      const data = await res.json();
      if (data.success) {
        setSedes(data.sedes);
      }
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    }
  };

  // Filtrar solicitudes cuando cambian los filtros
  useEffect(() => {
    let resultado = filtrarSolicitudes(solicitudes, searchTerm, estadoFiltro);
    
    // Filtro adicional por sede (solo para administrador)
    if (sedeFiltro) {
      resultado = resultado.filter(solicitud => 
        solicitud.sede_nombre && solicitud.sede_nombre.toLowerCase().includes(sedeFiltro.toLowerCase())
      );
    }
    
    setSolicitudesFiltradas(resultado);
    setCurrentPage(1); // Resetear a página 1 cuando se aplican filtros
  }, [searchTerm, estadoFiltro, sedeFiltro, solicitudes]);

  const verDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
  };

  // El administrador ya no puede firmar solicitudes, solo verlas

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes</h1>
        <p className="text-gray-600">Monitoreo de solicitudes del sistema</p>
      </div>

      {/* Filtros Personalizados para Administrador */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador */}
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
              placeholder="Buscar por ID, cuentadante o destino..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Filtro por Estado */}
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="firmada_cuentadante">Firmada por Cuentadante</option>
            <option value="aprobada">Aprobada</option>
            <option value="en_prestamo">En Préstamo</option>
            <option value="devuelto">Devuelto</option>
            <option value="rechazada">Rechazada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Filtro por Sede */}
          <select
            value={sedeFiltro}
            onChange={(e) => setSedeFiltro(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Todas las sedes</option>
            {sedes.map(sede => (
              <option key={sede.id} value={sede.nombre}>{sede.nombre}</option>
            ))}
          </select>
        </div>

        {/* Información de filtros y botón limpiar */}
        {!loading && (searchTerm || estadoFiltro || sedeFiltro) && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div>
              {searchTerm && (
                <span>Búsqueda: <span className="font-semibold text-gray-900">&quot;{searchTerm}&quot;</span></span>
              )}
              {searchTerm && (estadoFiltro || sedeFiltro) && <span className="mx-2">•</span>}
              {estadoFiltro && (
                <span>Estado: <span className="font-semibold text-gray-900">{estadoFiltro}</span></span>
              )}
              {estadoFiltro && sedeFiltro && <span className="mx-2">•</span>}
              {sedeFiltro && (
                <span>Sede: <span className="font-semibold text-gray-900">{sedeFiltro}</span></span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setEstadoFiltro('');
                setSedeFiltro('');
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

      <TablaSolicitudes
        solicitudes={solicitudesFiltradas}
        loading={loading}
        onVerDetalles={verDetalles}
        mensajeVacio="No hay solicitudes disponibles"
        mostrarSolicitante={true}
        mostrarAccionExtra={false}
        mostrarFiltros={false}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal de detalles */}
      {solicitudSeleccionada && (
        <ModalDetalleSolicitud
          solicitud={solicitudSeleccionada}
          onClose={() => setSolicitudSeleccionada(null)}
        />
      )}
    </div>
  );
}
