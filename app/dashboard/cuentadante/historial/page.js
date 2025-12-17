'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { filtrarSolicitudes } from '@/lib/solicitudUtils';

export default function HistorialSolicitudesCuentadante() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    if (user) {
      fetchSolicitudes();
    }
  }, [user]);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      // Obtener todas las solicitudes (historial completo)
      const res = await fetch(`/api/solicitudes/cuentadante?documento=${user.documento}&tipo=historial`);
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

  // Filtrar solicitudes cuando cambian los filtros
  useEffect(() => {
    const resultado = filtrarSolicitudes(solicitudes, searchTerm, estadoFiltro);
    setSolicitudesFiltradas(resultado);
    setCurrentPage(1); // Resetear a página 1 cuando se aplican filtros
  }, [searchTerm, estadoFiltro, solicitudes]);

  const verDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Historial de Solicitudes</h1>
        <p className="text-gray-600">Todas las solicitudes que han incluido tus bienes</p>
      </div>

      <TablaSolicitudes
        solicitudes={solicitudesFiltradas}
        loading={loading}
        onVerDetalles={verDetalles}
        mensajeVacio="No hay historial de solicitudes"
        mostrarSolicitante={true}
        mostrarAccionExtra={false}
        mostrarFiltros={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        estadoFiltro={estadoFiltro}
        onEstadoChange={setEstadoFiltro}
        estadosPermitidos={[
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'firmada_cuentadante', label: 'Firmada por Cuentadante' },
          { value: 'aprobada', label: 'Aprobada' },
          { value: 'en_prestamo', label: 'En Préstamo' },
          { value: 'devuelto', label: 'Devuelto' },
          { value: 'rechazada', label: 'Rechazada' },
          { value: 'cancelada', label: 'Cancelada' }
        ]}
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
