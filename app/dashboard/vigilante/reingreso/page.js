'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModalDetalleSolicitud from '@/app/components/ModalDetalleSolicitud';
import TablaSolicitudes from '@/app/components/TablaSolicitudes';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { Button } from '@/app/components/Button';

export default function ReingresoVigilante() {
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
            fetchEnTransito();
        }
    }, [user]);

    const fetchEnTransito = async () => {
        try {
            // Fetch only items that are "in transit" (en_prestamo or similar active state)
            // Since the user said "todo esta funcionando con la base de datos", I'll try filtering the "historial" endpoint 
            // OR see if there's a better endpoint. The previous code used ?tipo=historial.
            // Buscamos solicitudes que estén en préstamo para poder registrar su devolución.
            // Ideally, reingreso is for items that HAVE LEFT and are coming back.
            // So status should be 'en_prestamo'.

            const res = await fetch(`/api/solicitudes/vigilante?tipo=historial&documento=${user.documento}`);
            const data = await res.json();
            if (data.success) {
                // Filter specifically for items that are currently OUT (en_prestamo)
                const enTransito = data.solicitudes.filter(s => s.estado === 'en_prestamo');
                // Solo solicitudes en préstamo pueden ser devueltas
                // I'll keep both for safety as per the previous code which allowed action on both.

                setSolicitudes(enTransito);
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

    const registrarEntrada = async () => {
        const observacion = await prompt('Observación (opcional):', {
            title: 'Registrar entrada',
            placeholder: 'Ingresa una observación...'
        });

        const confirmed = await confirm('¿Confirmar registro de entrada (devolución)?', {
            title: 'Confirmar devolución',
            confirmText: 'Registrar',
            type: 'success'
        });
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/solicitudes/${solicitudSeleccionada.id}/registrar-entrada`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documento: user.documento,
                    observacion
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Entrada registrada exitosamente');
                setSolicitudSeleccionada(null);
                fetchEnTransito(); // Refresh list to remove the returned item
            } else {
                toast.error(data.error || 'Error al registrar entrada');
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
                <h1 className="text-2xl font-bold text-gray-800">Reingreso de Bienes</h1>
                <p className="text-gray-600">Registrar devolución de bienes en tránsito</p>
            </div>

            <TablaSolicitudes
                solicitudes={solicitudes}
                loading={loading}
                onVerDetalles={verDetalles}
                mensajeVacio="No hay bienes pendientes de reingreso"
                mostrarSolicitante={true}
                mostrarAccionExtra={false}
            />

            {/* Modal de detalles */}
            {solicitudSeleccionada && (
                <ModalDetalleSolicitud
                    solicitud={solicitudSeleccionada}
                    onClose={() => setSolicitudSeleccionada(null)}
                >
                    <Button
                        onClick={registrarEntrada}
                        className="w-full sm:w-auto"
                    >
                        Registrar Entrada
                    </Button>
                </ModalDetalleSolicitud>
            )}
        </div>
    );
}
