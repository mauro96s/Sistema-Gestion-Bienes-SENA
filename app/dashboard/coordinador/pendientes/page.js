'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { Button } from '@/app/components/Button';

export default function SolicitudesPendientesCoordinador() {
  const router = useRouter();
  const toast = useToast();
  const { confirm, prompt } = useConfirm();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [puedeFiremarState, setPuedeFiremarState] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.rol !== 'coordinador') {
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
      const res = await fetch(`/api/solicitudes?rol=coordinador&documento=${user.documento}`);
      const data = await res.json();

      if (data.success) {
        // Filtrar solo las que están firmadas por cuentadante (pendientes de coordinador)
        const pendientes = data.solicitudes.filter(s => s.estado === 'firmada_cuentadante');
        setSolicitudes(pendientes);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = async (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    // Verificar si puede firmar
    const puede = await puedeFiremar(solicitud);
    setPuedeFiremarState(puede);
  };

  const puedeFiremar = async (solicitud) => {
    // Verificar si el cuentadante ya firmó
    try {
      const res = await fetch(`/api/solicitudes/${solicitud.id}/firmas`);
      const data = await res.json();
      if (data.success) {
        const firmaCuentadante = data.firmas.find(f => f.rol_usuario === 'cuentadante');
        return firmaCuentadante && firmaCuentadante.firma === true;
      }
    } catch (error) {
      console.error('Error:', error);
    }
    return false;
  };

  const handleFirmar = async (aprobar) => {
    const observacion = await prompt(
      aprobar ? 'Observación (opcional):' : 'Motivo del rechazo:',
      {
        title: aprobar ? 'Aprobar solicitud' : 'Rechazar solicitud',
        placeholder: aprobar ? 'Ingresa una observación...' : 'Debes indicar el motivo...'
      }
    );

    if (!aprobar && !observacion) {
      toast.warning('Debes indicar el motivo del rechazo');
      return;
    }

    const confirmed = await confirm(`¿Confirmar ${aprobar ? 'aprobación' : 'rechazo'}?`, {
      title: aprobar ? 'Aprobar solicitud' : 'Rechazar solicitud',
      confirmText: aprobar ? 'Aprobar' : 'Rechazar',
      type: aprobar ? 'success' : 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/solicitudes/${solicitudSeleccionada.id}/firmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: 'coordinador',
          documento: user.documento,
          firma: aprobar,
          observacion
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(aprobar ? 'Solicitud aprobada exitosamente' : 'Solicitud rechazada');
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
        <p className="text-gray-600">Solicitudes que requieren tu aprobación</p>
      </div>

      <TablaSolicitudes
        solicitudes={solicitudes}
        loading={loading}
        onVerDetalles={verDetalles}
        mensajeVacio="No hay solicitudes pendientes de tu aprobación"
        mostrarSolicitante={true}
        mostrarAccionExtra={false}
      />

      {/* Modal de detalles */}
      {solicitudSeleccionada && (
        <ModalDetalleSolicitud
          solicitud={solicitudSeleccionada}
          onClose={() => setSolicitudSeleccionada(null)}
        >
          {solicitudSeleccionada.estado?.toLowerCase() === 'firmada_cuentadante' && (
            <>
              <Button
                onClick={() => handleFirmar(false)}
                disabled={!puedeFiremarState}
                variant="danger"
                title={!puedeFiremarState ? 'El cuentadante debe firmar primero' : ''}
              >
                Rechazar
              </Button>
              <Button
                onClick={() => handleFirmar(true)}
                disabled={!puedeFiremarState}
                title={!puedeFiremarState ? 'El cuentadante debe firmar primero' : ''}
              >
                Aprobar
              </Button>
            </>
          )}
        </ModalDetalleSolicitud>
      )}
    </div>
  );
}
