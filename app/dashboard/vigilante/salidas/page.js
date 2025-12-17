'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { Button } from '@/app/components/Button';

export default function AutorizarSalidas() {
  const router = useRouter();
  const toast = useToast();
  const { confirm, prompt } = useConfirm();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.rol !== 'vigilante') {
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
      const res = await fetch(`/api/solicitudes/vigilante?tipo=pendientes&documento=${user.documento}`);
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

  const autorizarSalida = async () => {
    const observacion = await prompt('Observación (opcional):', {
      title: 'Autorizar salida',
      placeholder: 'Ingresa una observación...'
    });

    const confirmed = await confirm('¿Confirmar autorización de salida?', {
      title: 'Confirmar autorización',
      confirmText: 'Autorizar',
      type: 'success'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/solicitudes/${solicitudSeleccionada.id}/firmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: 'vigilante',
          documento: user.documento,
          firma: true,
          observacion
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Bienes entregados exitosamente');
        setSolicitudSeleccionada(null);
        fetchSolicitudes();
      } else {
        toast.error(data.error || 'Error al autorizar');
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
        <h1 className="text-2xl font-bold text-gray-800">Autorizar Salidas</h1>
        <p className="text-gray-600">Solicitudes aprobadas esperando autorización</p>
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
          mensajeVacio="No hay solicitudes pendientes de autorización"
          mostrarSolicitante={true}
          mostrarAccionExtra={false}
        />
      )}

      {/* Modal de detalles */}
      {solicitudSeleccionada && (
        <ModalDetalleSolicitud
          solicitud={solicitudSeleccionada}
          onClose={() => setSolicitudSeleccionada(null)}
        >
          {solicitudSeleccionada.estado === 'aprobada' && (
            <Button
              onClick={autorizarSalida}
            >
              Autorizar Salida
            </Button>
          )}
        </ModalDetalleSolicitud>
      )}
    </div>
  );
}
