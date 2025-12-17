'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';

export default function SolicitudesCoordinador() {
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
      const res = await fetch(`/api/solicitudes?rol=coordinador&documento=${user.documento}`);
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

  const verDetalles = async (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    // Verificar si puede firmar
    const puede = await puedeFiremar(solicitud);
    setPuedeFiremarState(puede);
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
        <p className="text-gray-600">Revisa y aprueba solicitudes</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
        </div>
      ) : (
        <TablaSolicitudes
          solicitudes={solicitudes}
          loading={loading}
          onVerDetalles={verDetalles}
          mensajeVacio="No hay solicitudes en el sistema"
          mostrarSolicitante={true}
          mostrarAccionExtra={false}
        />
      )}

      {/* Modal */}
      {solicitudSeleccionada && (
        <ModalDetalleSolicitud
          solicitud={solicitudSeleccionada}
          onClose={() => setSolicitudSeleccionada(null)}
        >
          {solicitudSeleccionada.estado?.toLowerCase() === 'firmada_cuentadante' && (
            <>
              <button
                onClick={() => handleFirmar(false)}
                disabled={!puedeFiremarState}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={!puedeFiremarState ? 'El cuentadante debe firmar primero' : ''}
              >
                Rechazar
              </button>
              <button
                onClick={() => handleFirmar(true)}
                disabled={!puedeFiremarState}
                className="px-4 py-2 bg-[#39A900] text-white rounded-lg hover:bg-[#2e8b00] transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={!puedeFiremarState ? 'El cuentadante debe firmar primero' : ''}
              >
                Aprobar
              </button>
            </>
          )}
        </ModalDetalleSolicitud>
      )}
    </div>
  );
}
