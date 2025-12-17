import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * PUT /api/asignaciones/[id]/bloquear
 * 
 * Actualiza el estado de bloqueo de una asignación
 * - bloqueado = true: Bien en préstamo
 * - bloqueado = false: Bien disponible para préstamo
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { bloqueado } = body;

    if (typeof bloqueado !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'El campo bloqueado debe ser un booleano' },
        { status: 400 }
      );
    }

    // Actualizar el estado de bloqueo
    const updateQuery = `
      UPDATE asignaciones 
      SET bloqueado = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(updateQuery, [bloqueado, parseInt(id)]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: bloqueado ? 'Bien marcado como en préstamo' : 'Bien marcado como disponible',
      asignacion: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado de bloqueo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar el estado de bloqueo',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
