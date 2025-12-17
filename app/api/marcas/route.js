import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, nombre FROM marcas WHERE activo = true ORDER BY nombre ASC'
    );
    
    return NextResponse.json({
      success: true,
      marcas: result.rows
    });
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar las marcas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { nombre } = await request.json();
    
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre de la marca es requerido' },
        { status: 400 }
      );
    }

    // Normalizar nombre (Title Case simple)
    const nombreNormalizado = nombre.trim();

    // Intentar insertar
    const result = await query(
      `INSERT INTO marcas (nombre) 
       VALUES ($1) 
       ON CONFLICT (nombre) DO UPDATE SET activo = true 
       RETURNING id, nombre`,
      [nombreNormalizado]
    );

    return NextResponse.json({
      success: true,
      marca: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear marca:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la marca' },
      { status: 500 }
    );
  }
}
