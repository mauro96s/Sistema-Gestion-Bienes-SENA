import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/solicitudes/[id]/detalles
 * 
 * Obtiene los bienes de una solicitud específica
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const result = await query(`
      SELECT 
        b.placa,
        b.serial,
        b.descripcion,
        m.nombre as marca,
        p.nombres || ' ' || p.apellidos as cuentadante_nombre
      FROM detalle_solicitud ds
      JOIN asignaciones a ON ds.asignacion_id = a.id
      JOIN bienes b ON a.bien_id = b.id
      LEFT JOIN marcas m ON b.marca_id = m.id
      JOIN persona p ON a.doc_persona = p.documento
      WHERE ds.solicitud_id = $1
      ORDER BY b.placa ASC
    `, [parseInt(id)]);

    return NextResponse.json({
      success: true,
      detalles: result.rows
    });

  } catch (error) {
    console.error('Error al obtener detalles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar detalles' },
      { status: 500 }
    );
  }
}
