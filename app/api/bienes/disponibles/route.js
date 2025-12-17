import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/bienes/disponibles
 * 
 * Obtiene todos los bienes que están asignados a cuentadantes
 * y NO están bloqueados (disponibles para préstamo)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeId = searchParams.get('sede_id');

    let sqlQuery = `
      SELECT 
        a.id as asignacion_id,
        b.id as bien_id,
        b.placa,
        b.descripcion,
        b.modelo,
        m.nombre as marca,
        amb.nombre as ambiente_nombre,
        p.documento as cuentadante_documento,
        p.nombres || ' ' || p.apellidos as cuentadante_nombre
      FROM asignaciones a
      JOIN bienes b ON a.bien_id = b.id
      LEFT JOIN marcas m ON b.marca_id = m.id
      JOIN ambientes amb ON a.ambiente_id = amb.id
      JOIN persona p ON a.doc_persona = p.documento
      WHERE a.bloqueado = false
    `;

    const params = [];

    if (sedeId) {
      sqlQuery += ` AND amb.sede_id = $1`;
      params.push(sedeId);
    }

    sqlQuery += ` ORDER BY b.placa ASC`;

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      bienes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener bienes disponibles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener bienes' },
      { status: 500 }
    );
  }
}
