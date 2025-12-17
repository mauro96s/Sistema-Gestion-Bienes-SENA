import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/bienes/sin-asignar
 * 
 * Obtiene todos los bienes que NO están asignados a ningún cuentadante
 * (para poder asignarlos)
 */
export async function GET() {
  try {
    const result = await query(`
      SELECT 
        b.id,
        b.placa as codigo,
        b.placa,
        b.descripcion,
        b.modelo,
        m.nombre as marca,
        b.serial,
        b.costo,
        b.fecha_compra,
        COALESCE(
          (SELECT estado FROM estado_bien WHERE bien_id = b.id ORDER BY fecha_registro DESC LIMIT 1),
          'disponible'
        ) as estado_asignacion
      FROM bienes b
      LEFT JOIN marcas m ON b.marca_id = m.id
      WHERE NOT EXISTS (
        SELECT 1 FROM asignaciones a WHERE a.bien_id = b.id
      )
      ORDER BY b.placa ASC
    `);

    return NextResponse.json({
      success: true,
      bienes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener bienes sin asignar:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener bienes' },
      { status: 500 }
    );
  }
}
