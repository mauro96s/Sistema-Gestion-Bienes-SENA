import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Obtener sedes (antes edificios)
    const result = await query('SELECT id, nombre FROM sedes ORDER BY nombre');
    
    return NextResponse.json({
      success: true,
      sedes: result.rows,
      // Mantener compatibilidad temporal si algún frontend viejo lo usa
      edificios: result.rows 
    });

  } catch (error) {
    console.error('Error al obtener sedes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las sedes' },
      { status: 500 }
    );
  }
}
