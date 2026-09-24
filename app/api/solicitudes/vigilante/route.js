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
      WHERE rp.doc_persona = ? AND r.nombre = 'vigilante'
    `, [documento]);

    const sedeId = sedeResult.rows[0]?.sede_id;

    if (!sedeId) {
      return NextResponse.json({ success: true, solicitudes: [] });
    }

    let sqlQuery = '';
    let params = [sedeId]; // ? será la sede

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
          CONCAT(p.nombres, ' ', p.apellidos) as solicitante_nombre,
          p.documento as solicitante_documento,
          sed.nombre as sede_nombre,
          (SELECT COUNT(*) FROM detalle_solicitud WHERE solicitud_id = s.id) as cantidad_bienes,
          (SELECT COUNT(*) FROM firma_solicitud WHERE solicitud_id = s.id) as firmas_completadas
        FROM solicitudes s
        JOIN persona p ON s.doc_persona = p.documento
        LEFT JOIN sedes sed ON s.sede_id = sed.id
        WHERE s.estado = 'aprobada' AND s.sede_id = ?
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
          CONCAT(p.nombres, ' ', p.apellidos) as solicitante_nombre,
          p.documento as solicitante_documento,
          sed.nombre as sede_nombre,
          (SELECT COUNT(*) FROM detalle_solicitud WHERE solicitud_id = s.id) as cantidad_bienes,
          (SELECT COUNT(*) FROM firma_solicitud WHERE solicitud_id = s.id) as firmas_completadas,
          (SELECT MIN(fecha_firmado) FROM firma_solicitud WHERE solicitud_id = s.id AND (rol_usuario = 'vigilante' OR rol_usuario = 'vigilante_salida')) as fecha_salida
        FROM solicitudes s
        JOIN persona p ON s.doc_persona = p.documento
        LEFT JOIN sedes sed ON s.sede_id = sed.id
        WHERE s.estado = 'en_prestamo' AND s.sede_id = ?
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
          CONCAT(p.nombres, ' ', p.apellidos) as solicitante_nombre,
          p.documento as solicitante_documento,
          sed.nombre as sede_nombre,
          (SELECT COUNT(*) FROM detalle_solicitud WHERE solicitud_id = s.id) as cantidad_bienes,
          (SELECT COUNT(*) FROM firma_solicitud WHERE solicitud_id = s.id) as firmas_completadas,
          (SELECT MIN(fecha_firmado) FROM firma_solicitud WHERE solicitud_id = s.id AND (rol_usuario = 'vigilante' OR rol_usuario = 'vigilante_salida')) as fecha_salida,
          (SELECT MAX(fecha_firmado) FROM firma_solicitud WHERE solicitud_id = s.id AND (rol_usuario = 'vigilante' OR rol_usuario = 'vigilante_entrada')) as fecha_entrada
        FROM solicitudes s
        JOIN persona p ON s.doc_persona = p.documento
        LEFT JOIN sedes sed ON s.sede_id = sed.id
        WHERE s.estado IN ('aprobada', 'en_prestamo', 'devuelto') AND s.sede_id = ?
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
