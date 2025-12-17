'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { filtrarSolicitudes } from '@/lib/solicitudUtils';

export default function MisSolicitudes() {
  const router = useRouter();
  const toast = useToast();
  const { confirm, prompt } = useConfirm();
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
      setUser(JSON.parse(userData));
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
      const res = await fetch(`/api/solicitudes?rol=usuario&documento=${user.documento}`);
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
  }, [searchTerm, estadoFiltro, solicitudes]);

  const verDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
  };

  const cancelarSolicitud = async (solicitudId) => {
    // Primero pedir el motivo de cancelación
    const motivoCancelacion = await prompt('¿Por qué deseas cancelar esta solicitud?', {
      title: 'Motivo de cancelación',
      placeholder: 'Ej: Ya no necesito los bienes, cambié de fecha, etc.'
    });

    // Si el usuario canceló el modal, no hacer nada
    if (motivoCancelacion === null) {
      return;
    }

    // Si el usuario envió vacío, mostrar advertencia
    if (motivoCancelacion.trim() === '') {
      toast.warning('Debes indicar el motivo de la cancelación');
      return;
    }

    // Luego confirmar la cancelación
    const confirmed = await confirm(`¿Confirmar cancelación?\n\nMotivo: "${motivoCancelacion}"`, {
      title: 'Cancelar solicitud',
      confirmText: 'Sí, cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo_cancelacion: motivoCancelacion
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Solicitud cancelada exitosamente');
        fetchSolicitudes();
      } else {
        toast.error(data.error || 'Error al cancelar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
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
        <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes</h1>
        <p className="text-gray-600">Historial de solicitudes de préstamo</p>
      </div>

      <TablaSolicitudes
        solicitudes={solicitudesFiltradas}
        loading={loading}
        onVerDetalles={verDetalles}
        onAccionExtra={(solicitud) => cancelarSolicitud(solicitud.id)}
        mensajeVacio="No tienes solicitudes aún"
        mostrarSolicitante={false}
        mostrarAccionExtra={true}
        textoAccionExtra={() => 'Cancelar'}
        mostrarBotonExtra={(solicitud) => solicitud.estado === 'pendiente'}
        mostrarFiltros={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        estadoFiltro={estadoFiltro}
        onEstadoChange={setEstadoFiltro}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal de detalles */}
      {solicitudSeleccionada && (
        <ModalDetalleSolicitud
          solicitud={solicitudSeleccionada}
          onClose={() => setSolicitudSeleccionada(null)}
        >
          {solicitudSeleccionada.estado === 'pendiente' && (
            <button
              onClick={() => {
                setSolicitudSeleccionada(null);
                cancelarSolicitud(solicitudSeleccionada.id);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Cancelar Solicitud
            </button>
          )}
        </ModalDetalleSolicitud>
      )}
    </div>
  );
}
