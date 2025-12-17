import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/ambientes
 * 
 * Obtiene todos los ambientes disponibles
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeId = searchParams.get('sede_id');

    let sqlQuery = `
      SELECT 
        a.id,
        a.nombre,
        s.nombre as sede_nombre,
        a.sede_id
      FROM ambientes a
      JOIN sedes s ON a.sede_id = s.id
    `;

    const params = [];

    if (sedeId) {
      sqlQuery += ` WHERE a.sede_id = $1`;
      params.push(sedeId);
    }

    sqlQuery += ` ORDER BY s.nombre ASC, a.nombre ASC`;

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      ambientes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener ambientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener ambientes' },
      { status: 500 }
    );
  }
}
