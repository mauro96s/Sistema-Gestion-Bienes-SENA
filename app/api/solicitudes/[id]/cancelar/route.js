import { getClient, query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST /api/solicitudes/[id]/cancelar
 * 
 * Cancela una solicitud (solo si está en estado pendiente)
 */
export async function POST(request, { params }) {
  let client;
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { motivo_cancelacion } = body;

    if (!motivo_cancelacion || motivo_cancelacion.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El motivo de cancelación es obligatorio' },
        { status: 400 }
      );
    }

    client = await getClient();
    await client.query('START TRANSACTION');

    // Verificar que la solicitud existe y está pendiente
    const checkResult = await client.query(
      'SELECT estado, observaciones FROM solicitudes WHERE id = ? FOR UPDATE',
      [parseInt(id)]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Solicitud no encontrada');
    }

    if (checkResult.rows[0].estado !== 'pendiente') {
      throw new Error('Solo se pueden cancelar solicitudes pendientes');
    }

    // Preparar la observación de cancelación
    const observacionesActuales = checkResult.rows[0].observaciones || '';
    const nuevaObservacion = observacionesActuales 
      ? `${observacionesActuales}\n\nCANCELADA POR USUARIO: ${motivo_cancelacion}`
      : `CANCELADA POR USUARIO: ${motivo_cancelacion}`;

    // 1. Cancelar la solicitud y agregar observación
    await client.query(
      "UPDATE solicitudes SET estado = 'cancelada', observaciones = ? WHERE id = ?",
      [nuevaObservacion, parseInt(id)]
    );

    // 2. Obtener los bienes vinculados para desbloquearlos
    const detallesResult = await client.query(
      'SELECT asignacion_id FROM detalle_solicitud WHERE solicitud_id = ?',
      [parseInt(id)]
    );

    const asignacionIds = detallesResult.rows.map(row => row.asignacion_id);

    if (asignacionIds.length > 0) {
      // Desbloquear bienes (bloqueado = 0)
      const placeholders = asignacionIds.map(() => '?').join(',');
      await client.query(
        `UPDATE asignaciones SET bloqueado = 0 WHERE id IN (${placeholders})`,
        asignacionIds
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Solicitud cancelada exitosamente y bienes liberados'
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al cancelar solicitud:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al cancelar solicitud' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
