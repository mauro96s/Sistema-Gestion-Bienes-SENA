import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/bienes/disponibles
 * 
 * Obtiene bienes asignados que están en buen estado y no están bloqueados
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
        COALESCE(amb.nombre, 'Sin ambiente') as ambiente_nombre,
        p.documento as cuentadante_documento,
        CONCAT(p.nombres, ' ', p.apellidos) as cuentadante_nombre
      FROM asignaciones a
      JOIN bienes b ON a.bien_id = b.id
      LEFT JOIN marcas m ON b.marca_id = m.id
      LEFT JOIN ambientes amb ON a.ambiente_id = amb.id
      JOIN persona p ON a.doc_persona = p.documento
      WHERE a.bloqueado = 0
      AND COALESCE(
        (SELECT eb.estado 
         FROM estado_bien eb 
         WHERE eb.bien_id = b.id 
         ORDER BY eb.fecha_registro DESC 
         LIMIT 1), 
        'buen_estado'
      ) = 'buen_estado'
    `;

    const params = [];

    if (sedeId) {
      // Si hay sede_id, filtramos por la sede del ambiente
      sqlQuery += ` AND (amb.sede_id = ? OR amb.sede_id IS NULL)`;
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
