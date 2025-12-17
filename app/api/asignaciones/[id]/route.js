import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/asignaciones/[id]
 * 
 * Desasigna un bien (elimina la asignación)
 * El bien volverá a estar disponible para asignar
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Validar que el ID existe y es válido
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'ID de asignación inválido' },
        { status: 400 }
      );
    }

    const asignacionId = parseInt(id);

    // Verificar que la asignación existe
    const checkQuery = `
      SELECT a.id, b.placa, a.bloqueado
      FROM asignaciones a
      JOIN bienes b ON a.bien_id = b.id
      WHERE a.id = $1
    `;
    
    const checkResult = await query(checkQuery, [asignacionId]);

    if (checkResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    const asignacion = checkResult.rows[0];

    // Validar que el bien NO esté en préstamo
    if (asignacion.bloqueado) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede desasignar un bien que está actualmente en préstamo' 
        },
        { status: 400 }
      );
    }

    // Validar que no existan solicitudes históricas que referencien esta asignación
    const solicitudesQuery = `
      SELECT COUNT(*) as total
      FROM detalle_solicitud ds
      WHERE ds.asignacion_id = $1
    `;
    
    const solicitudesResult = await query(solicitudesQuery, [asignacionId]);
    const totalSolicitudes = parseInt(solicitudesResult.rows[0].total);

    if (totalSolicitudes > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No se puede desasignar este bien porque tiene ${totalSolicitudes} solicitud(es) en el historial. Los bienes con historial de solicitudes no pueden ser desasignados para mantener la integridad de los datos.` 
        },
        { status: 400 }
      );
    }

    // Eliminar la asignación
    const deleteQuery = `
      DELETE FROM asignaciones 
      WHERE id = $1
      RETURNING *
    `;

    await query(deleteQuery, [asignacionId]);

    return NextResponse.json({
      success: true,
      message: `Bien ${asignacion.placa} desasignado exitosamente`
    });

  } catch (error) {
    console.error('Error al desasignar bien:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al desasignar el bien',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
