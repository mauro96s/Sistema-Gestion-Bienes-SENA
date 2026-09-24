import { query, getClient } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST /api/solicitudes/[id]/firmar
 * 
 * Registra la firma de un rol (cuentadante, coordinador, administrador)
 * y actualiza el estado de la solicitud según corresponda
 */
export async function POST(request, { params }) {
  let client;
  
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { rol, documento, firma, observacion } = body;

    // Obtener un cliente dedicado para la transacción
    client = await getClient();
    await client.query('START TRANSACTION');

    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID inválido');
    }

    if (!rol || !documento || firma === undefined) {
      throw new Error('Faltan campos requeridos');
    }

    // Validar que si rechaza, debe incluir observación obligatoria
    if (firma === false && (!observacion || observacion.trim() === '')) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'La observación es obligatoria cuando se rechaza una solicitud' },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const solicitudResult = await client.query(
      'SELECT estado FROM solicitudes WHERE id = ?',
      [parseInt(id)]
    );

    if (solicitudResult.rows.length === 0) {
      throw new Error('Solicitud no encontrada');
    }

    const estadoActual = solicitudResult.rows[0].estado;

    // Validar que se puede firmar según el estado
    if (rol === 'cuentadante' && estadoActual !== 'pendiente') {
      throw new Error('Esta solicitud ya no está pendiente');
    }

    if (rol === 'coordinador' && estadoActual !== 'firmada_cuentadante') {
      throw new Error('El cuentadante aún no ha firmado');
    }

    if (rol === 'vigilante' && estadoActual !== 'aprobada') {
      throw new Error('La solicitud debe estar aprobada por el coordinador');
    }

    // Validar sede para coordinador y vigilante
    if (rol === 'coordinador' || rol === 'vigilante') {
      const rolNombre = rol === 'coordinador' ? 'coordinador' : 'vigilante';
      const sedeValidationResult = await client.query(`
        SELECT s.sede_id, rp.sede_id as usuario_sede_id
        FROM solicitudes s
        INNER JOIN rol_persona rp ON rp.doc_persona = ?
        INNER JOIN rol r ON rp.rol_id = r.id
        WHERE s.id = ? AND r.nombre = ?
      `, [documento, parseInt(id), rolNombre]);

      if (sedeValidationResult.rows.length === 0) {
        throw new Error(`No tienes permisos como ${rolNombre} o la solicitud no existe`);
      }

      const { sede_id: solicitudSedeId, usuario_sede_id: usuarioSedeId } = sedeValidationResult.rows[0];

      if (!usuarioSedeId) {
        throw new Error('No tienes una sede asignada. Contacta al administrador.');
      }

      if (solicitudSedeId !== usuarioSedeId) {
        throw new Error('Solo puedes firmar solicitudes de tu sede asignada');
      }
    }

    // Registrar la firma (firma en MySQL es TINYINT(1), usamos 1 o 0)
    await client.query(`
      INSERT INTO firma_solicitud (solicitud_id, rol_usuario, doc_persona, firma, observacion)
      VALUES (?, ?, ?, ?, ?)
    `, [parseInt(id), rol, documento, firma ? 1 : 0, observacion || null]);

    // Actualizar estado de la solicitud
    let nuevoEstado = estadoActual;
    if (!firma) {
      nuevoEstado = 'rechazada';
      // Desbloquear bienes
      await client.query(`
        UPDATE asignaciones SET bloqueado = 0 
        WHERE id IN (
          SELECT asignacion_id FROM detalle_solicitud WHERE solicitud_id = ?
        )
      `, [parseInt(id)]);
    } else {
      if (rol === 'cuentadante') {
        nuevoEstado = 'firmada_cuentadante';
        // Bloquear bienes
        await client.query(`
          UPDATE asignaciones SET bloqueado = 1 
          WHERE id IN (
            SELECT asignacion_id FROM detalle_solicitud WHERE solicitud_id = ?
          )
        `, [parseInt(id)]);
      } else if (rol === 'coordinador') {
        nuevoEstado = 'aprobada';
      } else if (rol === 'vigilante') {
        nuevoEstado = 'en_prestamo';
      }
    }

    await client.query('UPDATE solicitudes SET estado = ? WHERE id = ?', [nuevoEstado, parseInt(id)]);
    
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: firma ? 'Firma registrada exitosamente' : 'Solicitud rechazada',
      nuevoEstado
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al firmar solicitud:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar la firma' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
