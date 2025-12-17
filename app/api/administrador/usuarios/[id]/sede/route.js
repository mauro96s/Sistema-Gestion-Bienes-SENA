import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/administrador/usuarios/[id]/sede
 * 
 * Asigna una sede a todos los roles de una persona
 * Solo accesible para administradores
 * 
 * Body:
 * {
 *   "sedeId": 1
 * }
 */
export async function POST(request, context) {
  try {
    // 1. Verificar token de autenticación
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Verificar que el usuario sea administrador
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    if (decoded.rol !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden acceder' },
        { status: 403 }
      );
    }

    // 3. Obtener parámetros
    const params = await context.params;
    const documento = params.id;
    const { sedeId } = await request.json();

    // 4. Validar que la persona exista
    const personaResult = await query(
      'SELECT documento FROM persona WHERE documento = $1',
      [documento]
    );

    if (personaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Persona no encontrada' },
        { status: 404 }
      );
    }

    // 5. Validar que la sede exista
    const sedeResult = await query(
      'SELECT id FROM sedes WHERE id = $1',
      [sedeId]
    );

    if (sedeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sede no encontrada' },
        { status: 404 }
      );
    }

    // 6. Actualizar la sede de todos los roles de la persona
    await query(`
      UPDATE rol_persona 
      SET sede_id = $1 
      WHERE doc_persona = $2
    `, [sedeId, documento]);

    console.log(`✅ Sede actualizada para persona ${documento} por admin ${decoded.id}`);

    // 7. Retornar éxito
    return NextResponse.json({
      success: true,
      message: 'Sede actualizada correctamente'
    });

  } catch (error) {
    console.error('❌ Error al asignar sede:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
