import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/sedes
 * 
 * Obtiene todas las sedes disponibles
 */
export async function GET() {
  try {
    const result = await query('SELECT id, nombre FROM sedes ORDER BY nombre ASC');

    return NextResponse.json({
      success: true,
      sedes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener sedes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener sedes' },
      { status: 500 }
    );
  }
}
