import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/solicitudes/vigilante
 * 
 * Obtiene solicitudes para el vigilante según el tipo:
 * - pendientes: Solicitudes aprobadas esperando entrega por vigilante
 * - autorizadas: Solicitudes con bienes en préstamo
 * - historial: Todas las solicitudes procesadas por el vigilante
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'pendientes';
    const documento = searchParams.get('documento');

    if (!documento) {
      return NextResponse.json({ success: true, solicitudes: [] });
    }

    // Obtener Sede del Vigilante
    const sedeResult = await query(`
      SELECT rp.sede_id 
      FROM rol_persona rp
      JOIN rol r ON rp.rol_id = r.id
      WHERE rp.doc_persona = $1 AND r.nombre = 'vigilante'
    `, [documento]);

    const sedeId = sedeResult.rows[0]?.sede_id;

    if (!sedeId) {
      return NextResponse.json({ success: true, solicitudes: [] });
    }

    let sqlQuery = '';
    let params = [sedeId]; // $1 será la sede

    if (tipo === 'pendientes') {
      // Solicitudes aprobadas esperando autorización de salida
      sqlQuery = `
        SELECT 
          s.id,
          s.fecha_ini_prestamo,
          s.fecha_fin_prestamo,
          s.destino,
          s.motivo,
          s.estado,
          p.nombres || ' ' || p.apellidos as solicitante_nombre,
          p.documento as solicitante_documento,
          sed.nombre as sede_nombre,
          (SELECT COUNT(*) FROM detalle_solicitud WHERE solicitud_id = s.id) as cantidad_bienes,
          (SELECT COUNT(*) FROM firma_solicitud WHERE solicitud_id = s.id) as firmas_completadas
        FROM solicitudes s
        JOIN persona p ON s.doc_persona = p.documento
        LEFT JOIN sedes sed ON s.sede_id = sed.id
        WHERE s.estado = 'aprobada' AND s.sede_id = $1
        ORDER BY s.id DESC
      `;
    } else if (tipo === 'autorizadas') {
      // Solicitudes con bienes en préstamo (esperando devolución)
      sqlQuery = `
        SELECT 
          s.id,
          s.fecha_ini_prestamo,
          s.fecha_fin_prestamo,
          s.destino,
          s.motivo,
          s.estado,
          p.nombres || ' ' || p.apellidos as solicitante_nombre,
          p.documento as solicitante_documento,
          sed.nombre as sede_nombre,
          (SELECT COUNT(*) FROM detalle_solicitud WHERE solicitud_id = s.id) as cantidad_bienes,
          (SELECT COUNT(*) FROM firma_solicitud WHERE solicitud_id = s.id) as firmas_completadas,
          fs_salida.fecha_firmado as fecha_salida
        FROM solicitudes s
        JOIN persona p ON s.doc_persona = p.documento
        LEFT JOIN sedes sed ON s.sede_id = sed.id
        LEFT JOIN LATERAL (
          SELECT fecha_firmado 
          FROM firma_solicitud 
          WHERE solicitud_id = s.id 
          AND (rol_usuario = 'vigilante' OR rol_usuario = 'vigilante_salida')
          ORDER BY fecha_firmado ASC, id ASC
          LIMIT 1
        ) fs_salida ON TRUE
        WHERE s.estado = 'en_prestamo' AND s.sede_id = $1
        ORDER BY s.id DESC
      `;
    } else if (tipo === 'historial') {
      // Todas las solicitudes procesadas por el vigilante
      sqlQuery = `
        SELECT 
          s.id,
          s.fecha_ini_prestamo,
          s.fecha_fin_prestamo,
          s.destino,
          s.motivo,
          s.estado,
          p.nombres || ' ' || p.apellidos as solicitante_nombre,
          p.documento as solicitante_documento,
          sed.nombre as sede_nombre,
          (SELECT COUNT(*) FROM detalle_solicitud WHERE solicitud_id = s.id) as cantidad_bienes,
          (SELECT COUNT(*) FROM firma_solicitud WHERE solicitud_id = s.id) as firmas_completadas,
          fs_salida.fecha_firmado as fecha_salida,
          fs_entrada.fecha_firmado as fecha_entrada
        FROM solicitudes s
        JOIN persona p ON s.doc_persona = p.documento
        LEFT JOIN sedes sed ON s.sede_id = sed.id
        LEFT JOIN LATERAL (
          SELECT fecha_firmado, id 
          FROM firma_solicitud 
          WHERE solicitud_id = s.id 
          AND (rol_usuario = 'vigilante' OR rol_usuario = 'vigilante_salida')
          ORDER BY fecha_firmado ASC, id ASC
          LIMIT 1
        ) fs_salida ON TRUE
        LEFT JOIN LATERAL (
          SELECT fecha_firmado 
          FROM firma_solicitud 
          WHERE solicitud_id = s.id 
          AND (rol_usuario = 'vigilante' OR rol_usuario = 'vigilante_entrada')
          AND id <> fs_salida.id
          ORDER BY fecha_firmado DESC, id DESC
          LIMIT 1
        ) fs_entrada ON TRUE
        WHERE s.estado IN ('aprobada', 'en_prestamo', 'devuelto') AND s.sede_id = $1
        ORDER BY s.id DESC
      `;
    }

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      solicitudes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener solicitudes del vigilante:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar solicitudes' },
      { status: 500 }
    );
  }
}
