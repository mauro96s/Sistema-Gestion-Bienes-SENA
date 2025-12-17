import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST /api/solicitudes/[id]/firmar
 * 
 * Registra la firma de un rol (cuentadante, coordinador, administrador)
 * y actualiza el estado de la solicitud según corresponda
 */
export async function POST(request, { params }) {
  const client = await query('BEGIN');
  
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || isNaN(parseInt(id))) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rol, documento, firma, observacion } = body;

    if (!rol || !documento || firma === undefined) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que si rechaza, debe incluir observación obligatoria
    if (firma === false && (!observacion || observacion.trim() === '')) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'La observación es obligatoria cuando se rechaza una solicitud' },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const solicitudResult = await query(
      'SELECT estado FROM solicitudes WHERE id = $1',
      [parseInt(id)]
    );

    if (solicitudResult.rows.length === 0) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const estadoActual = solicitudResult.rows[0].estado;

    // Validar que se puede firmar según el estado
    if (rol === 'cuentadante' && estadoActual !== 'pendiente') {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Esta solicitud ya no está pendiente' },
        { status: 400 }
      );
    }

    if (rol === 'coordinador' && estadoActual !== 'firmada_cuentadante') {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'El cuentadante aún no ha firmado' },
        { status: 400 }
      );
    }

    if (rol === 'vigilante' && estadoActual !== 'aprobada') {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'La solicitud debe estar aprobada por el coordinador' },
        { status: 400 }
      );
    }

    // Validar que el coordinador y vigilante pertenezcan a la sede de la solicitud
    if (rol === 'coordinador' || rol === 'vigilante') {
      const rolNombre = rol === 'coordinador' ? 'coordinador' : 'vigilante';
      const sedeValidationResult = await query(`
        SELECT s.sede_id, rp.sede_id as usuario_sede_id
        FROM solicitudes s
        LEFT JOIN rol_persona rp ON rp.doc_persona = $2
        LEFT JOIN rol r ON rp.rol_id = r.id AND r.nombre = $3
        WHERE s.id = $1
      `, [parseInt(id), documento, rolNombre]);

      if (sedeValidationResult.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Solicitud no encontrada' },
          { status: 404 }
        );
      }

      const { sede_id: solicitudSedeId, usuario_sede_id: usuarioSedeId } = sedeValidationResult.rows[0];

      if (!usuarioSedeId) {
        await query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'No tienes una sede asignada. Contacta al administrador para que te asigne una sede.' },
          { status: 403 }
        );
      }

      if (solicitudSedeId !== usuarioSedeId) {
        await query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Solo puedes firmar solicitudes de tu sede asignada' },
          { status: 403 }
        );
      }
    }

    // El administrador ya no puede firmar solicitudes
    if (rol === 'administrador') {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'El administrador no puede firmar solicitudes' },
        { status: 403 }
      );
    }

    // Registrar la firma
    await query(`
      INSERT INTO firma_solicitud (solicitud_id, rol_usuario, doc_persona, firma, observacion)
      VALUES ($1, $2, $3, $4, $5)
    `, [parseInt(id), rol, documento, firma, observacion || null]);

    // Actualizar estado de la solicitud
    let nuevoEstado;
    if (!firma) {
      // Si rechaza, la solicitud queda rechazada
      nuevoEstado = 'rechazada';
      
      // Desbloquear bienes cuando se rechaza (cuentadante, coordinador o vigilante)
      if (rol === 'cuentadante' || rol === 'coordinador' || rol === 'vigilante') {
        await query(`
          UPDATE asignaciones 
          SET bloqueado = false 
          WHERE id IN (
            SELECT asignacion_id 
            FROM detalle_solicitud 
            WHERE solicitud_id = $1
          )
        `, [parseInt(id)]);
      }
    } else {
      // Si aprueba, avanza al siguiente estado
      if (rol === 'cuentadante') {
        nuevoEstado = 'firmada_cuentadante';
        
        // BLOQUEAR BIENES cuando el cuentadante firma
        await query(`
          UPDATE asignaciones 
          SET bloqueado = true 
          WHERE id IN (
            SELECT asignacion_id 
            FROM detalle_solicitud 
            WHERE solicitud_id = $1
          )
        `, [parseInt(id)]);
      } else if (rol === 'coordinador') {
        // El coordinador aprueba la solicitud
        nuevoEstado = 'aprobada';
        // Los bienes ya están bloqueados desde la firma del cuentadante
      } else if (rol === 'vigilante') {
        // El vigilante firma = entrega física = en préstamo
        nuevoEstado = 'en_prestamo';
        // Los bienes ya están bloqueados desde la firma del cuentadante
      }
    }

    await query(
      'UPDATE solicitudes SET estado = $1 WHERE id = $2',
      [nuevoEstado, parseInt(id)]
    );

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: firma ? 'Firma registrada exitosamente' : 'Solicitud rechazada',
      nuevoEstado
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error al firmar solicitud:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la firma' },
      { status: 500 }
    );
  }
}
