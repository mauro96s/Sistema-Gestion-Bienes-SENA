import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/solicitudes/cuentadante
 * 
 * Obtiene solicitudes que incluyen bienes asignados a un cuentadante específico
 * - tipo=pendientes: Solo solicitudes pendientes de firma
 * - tipo=historial: Todas las solicitudes que incluyen sus bienes
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const documento = searchParams.get('documento');
    const tipo = searchParams.get('tipo') || 'pendientes';

    if (!documento) {
      return NextResponse.json(
        { success: false, error: 'Documento requerido' },
        { status: 400 }
      );
    }

    let sqlQuery = `
      SELECT DISTINCT
        s.id,
        s.fecha_ini_prestamo,
        s.fecha_fin_prestamo,
        s.destino,
        s.motivo,
        s.estado,
        s.observaciones,
        p.nombres || ' ' || p.apellidos as solicitante_nombre,
        p.correo as solicitante_email,
        sed.nombre as sede_nombre,
        (
          SELECT COUNT(*) 
          FROM firma_solicitud fs 
          WHERE fs.solicitud_id = s.id
        ) as firmas_completadas,
        (
          SELECT COUNT(*) 
          FROM detalle_solicitud ds2 
          WHERE ds2.solicitud_id = s.id
        ) as items_count
      FROM solicitudes s
      JOIN persona p ON s.doc_persona = p.documento
      LEFT JOIN sedes sed ON s.sede_id = sed.id
      JOIN detalle_solicitud ds ON s.id = ds.solicitud_id
      JOIN asignaciones a ON ds.asignacion_id = a.id
      WHERE a.doc_persona = $1
    `;

    // Si es pendientes, filtrar solo las que necesitan firma del cuentadante
    if (tipo === 'pendientes') {
      sqlQuery += `
        AND s.estado = 'pendiente'
        AND NOT EXISTS (
          SELECT 1 FROM firma_solicitud fs
          WHERE fs.solicitud_id = s.id
            AND fs.rol_usuario = 'cuentadante'
            AND fs.doc_persona = $1
        )
      `;
    }
    // Si es historial, mostrar todas las solicitudes que incluyen sus bienes

    sqlQuery += ' ORDER BY s.id DESC';

    const result = await query(sqlQuery, [documento]);

    return NextResponse.json({
      success: true,
      solicitudes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener solicitudes del cuentadante:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar solicitudes' },
      { status: 500 }
    );
  }
}
