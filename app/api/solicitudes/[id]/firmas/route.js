import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/solicitudes/[id]/firmas
 * 
 * Obtiene todas las firmas de una solicitud
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const result = await query(`
      SELECT 
        fs.id,
        fs.rol_usuario,
        fs.doc_persona,
        fs.firma,
        fs.observacion,
        fs.fecha_firmado,
        p.nombres || ' ' || p.apellidos as firmante_nombre
      FROM firma_solicitud fs
      JOIN persona p ON fs.doc_persona = p.documento
      WHERE fs.solicitud_id = $1
      ORDER BY fs.fecha_firmado ASC
    `, [parseInt(id)]);

    // Transformar roles de vigilante para compatibilidad con Frontend
    let vigilanteCount = 0;
    const firmasTransformadas = result.rows.map(firma => {
      if (firma.rol_usuario === 'vigilante') {
        vigilanteCount++;
        return {
          ...firma,
          rol_usuario: vigilanteCount === 1 ? 'vigilante_salida' : 'vigilante_entrada'
        };
      }
      return firma;
    });

    return NextResponse.json({
      success: true,
      firmas: firmasTransformadas
    });

  } catch (error) {
    console.error('Error al obtener firmas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar firmas' },
      { status: 500 }
    );
  }
}
