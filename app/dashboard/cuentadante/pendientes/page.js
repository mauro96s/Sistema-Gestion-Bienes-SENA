'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { Button } from '@/app/components/Button';

export default function SolicitudesPendientesCuentadante() {
  const router = useRouter();
  const toast = useToast();
  const { confirm, prompt } = useConfirm();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
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
      const res = await fetch(`/api/solicitudes/cuentadante?documento=${user.documento}&tipo=pendientes`);
      const data = await res.json();

      if (data.success) {
        setSolicitudes(data.solicitudes);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
  };

  const handleFirmar = async (aprobar) => {
    const observacion = await prompt(
      aprobar ? 'Observación (opcional):' : 'Motivo del rechazo:',
      {
        title: aprobar ? 'Firmar solicitud' : 'Rechazar solicitud',
        placeholder: aprobar ? 'Ingresa una observación...' : 'Debes indicar el motivo...'
      }
    );

    if (!aprobar && !observacion) {
      toast.warning('Debes indicar el motivo del rechazo');
      return;
    }

    const confirmed = await confirm(`¿Confirmar ${aprobar ? 'firma' : 'rechazo'}?`, {
      title: aprobar ? 'Firmar solicitud' : 'Rechazar solicitud',
      confirmText: aprobar ? 'Firmar' : 'Rechazar',
      type: aprobar ? 'success' : 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/solicitudes/${solicitudSeleccionada.id}/firmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: 'cuentadante',
          documento: user.documento,
          firma: aprobar,
          observacion
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(aprobar ? 'Solicitud firmada exitosamente' : 'Solicitud rechazada');
        setSolicitudSeleccionada(null);
        fetchSolicitudes();
      } else {
        toast.error(data.error || 'Error al procesar');
      }
    } catch (error) {
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
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes Pendientes</h1>
        <p className="text-gray-600">Solicitudes que incluyen bienes bajo tu responsabilidad</p>
      </div>

      <TablaSolicitudes
        solicitudes={solicitudes}
        loading={loading}
        onVerDetalles={verDetalles}
        mensajeVacio="No hay solicitudes pendientes de tu firma"
        mostrarSolicitante={true}
        mostrarAccionExtra={false}
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
            <>
              <Button
                onClick={() => handleFirmar(false)}
                variant="danger"
              >
                Rechazar
              </Button>
              <Button
                onClick={() => handleFirmar(true)}
              >
                Firmar
              </Button>
            </>
          )}
        </ModalDetalleSolicitud>
      )}
    </div>
  );
}
