import { query, getClient } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST /api/solicitudes/[id]/registrar-entrada
 * 
 * El vigilante registra la entrada (devolución) de bienes
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
    const { documento, observacion } = body;

    if (!documento) {
      return NextResponse.json(
        { success: false, error: 'Documento del vigilante requerido' },
        { status: 400 }
      );
    }

    client = await getClient();
    await client.query('START TRANSACTION');

    // 1. Verificar que la solicitud existe y está en préstamo
    const solicitudResult = await client.query(
      'SELECT estado FROM solicitudes WHERE id = ?',
      [parseInt(id)]
    );

    if (solicitudResult.rows.length === 0) {
      throw new Error('Solicitud no encontrada');
    }

    const estadoActual = solicitudResult.rows[0].estado;

    if (estadoActual !== 'en_prestamo') {
      throw new Error('La solicitud debe estar en préstamo para registrar entrada');
    }

    // 2. Verificar si ya existe firma de entrada (la segunda firma de vigilante)
    const firmasExistentes = await client.query(
      `SELECT id FROM firma_solicitud 
       WHERE solicitud_id = ? AND rol_usuario = 'vigilante'`,
      [parseInt(id)]
    );

    if (firmasExistentes.rows.length >= 2) {
      throw new Error('La entrada ya fue registrada');
    }

    if (firmasExistentes.rows.length === 0) {
      throw new Error('No se ha registrado la salida previamente');
    }

    // 3. Registrar firma de entrada del vigilante
    await client.query(`
      INSERT INTO firma_solicitud (solicitud_id, rol_usuario, doc_persona, firma, observacion)
      VALUES (?, 'vigilante', ?, 1, ?)
    `, [parseInt(id), documento, observacion || 'Entrada registrada']);

    // 4. Actualizar estado de la solicitud
    await client.query(
      'UPDATE solicitudes SET estado = ? WHERE id = ?',
      ['devuelto', parseInt(id)]
    );

    // 5. Desbloquear los bienes de la solicitud
    await client.query(`
      UPDATE asignaciones 
      SET bloqueado = 0 
      WHERE id IN (
        SELECT asignacion_id 
        FROM detalle_solicitud 
        WHERE solicitud_id = ?
      )
    `, [parseInt(id)]);

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Entrada registrada exitosamente'
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al registrar entrada:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar el registro' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
