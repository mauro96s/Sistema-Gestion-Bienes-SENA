import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/bienes/generar-placa
 * 
 * Genera una placa única para un nuevo bien
 * Formato: SENA-YYYY-NNNN
 * Ejemplo: SENA-2024-0001
 */
export async function GET() {
  try {
    const year = new Date().getFullYear();
    
    // Obtener el último número de placa del año actual
    const result = await query(
      `SELECT placa FROM bienes 
       WHERE placa LIKE $1 
       ORDER BY placa DESC 
       LIMIT 1`,
      [`SENA-${year}-%`]
    );

    let nextNumber = 1;

    if (result.rows.length > 0) {
      // Extraer el número de la última placa
      const lastPlaca = result.rows[0].placa;
      const lastNumber = parseInt(lastPlaca.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    // Formatear el número con ceros a la izquierda (4 dígitos)
    const formattedNumber = String(nextNumber).padStart(4, '0');
    const newPlaca = `SENA-${year}-${formattedNumber}`;

    return NextResponse.json({
      success: true,
      placa: newPlaca
    });

  } catch (error) {
    console.error('Error al generar placa:', error);
    
    // En caso de error, generar una placa con timestamp
    const timestamp = Date.now().toString().slice(-6);
    const fallbackPlaca = `SENA-${new Date().getFullYear()}-${timestamp}`;
    
    return NextResponse.json({
      success: true,
      placa: fallbackPlaca
    });
  }
}
