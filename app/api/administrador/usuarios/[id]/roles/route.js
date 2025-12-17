import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/administrador/usuarios/[id]/roles
 * 
 * Asigna o remueve roles a un usuario
 * Solo accesible para administradores
 * 
 * Body:
 * {
 *   "rolesIds": [1, 2, 6],  // IDs de los roles a asignar
 *   "rolPrincipalId": 2     // ID del rol que será el principal
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

    // 3. Obtener parámetros (await params en Next.js 15+)
    const params = await context.params;
    const documento = params.id; // Ahora es documento, no ID numérico
    const { rolesIds, rolPrincipalId } = await request.json();

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

    // 5. Obtener el ID del rol "usuario"
    const rolUsuarioResult = await query(
      'SELECT id FROM rol WHERE nombre = $1',
      ['usuario']
    );

    if (rolUsuarioResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rol "usuario" no encontrado en el sistema' },
        { status: 500 }
      );
    }

    const rolUsuarioId = rolUsuarioResult.rows[0].id;

    // 6. Asegurar que el rol "usuario" siempre esté en la lista
    let rolesFinales = [...rolesIds];
    if (!rolesFinales.includes(rolUsuarioId)) {
      rolesFinales.push(rolUsuarioId);
    }

    // 7. Validar que haya al menos un rol
    if (!rolesFinales || rolesFinales.length === 0) {
      return NextResponse.json(
        { error: 'Debe asignar al menos un rol' },
        { status: 400 }
      );
    }

    // 8. Validar que el rol principal esté en la lista de roles
    const rolPrincipalIdNum = parseInt(rolPrincipalId);
    if (isNaN(rolPrincipalIdNum)) {
      return NextResponse.json(
        { error: 'El rol principal debe ser un ID válido' },
        { status: 400 }
      );
    }

    if (!rolesFinales.includes(rolPrincipalIdNum)) {
      return NextResponse.json(
        { error: 'El rol principal debe estar en la lista de roles asignados' },
        { status: 400 }
      );
    }

    // 9. Obtener una sede por defecto (necesaria para rol_persona)
    const sedeResult = await query('SELECT id FROM sedes LIMIT 1');
    if (sedeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No hay sedes disponibles en el sistema' },
        { status: 500 }
      );
    }
    const sedeId = sedeResult.rows[0].id;

    // 10. Iniciar transacción
    await query('BEGIN');

    try {
      // 11. Eliminar todos los roles actuales de la persona
      await query(
        'DELETE FROM rol_persona WHERE doc_persona = $1',
        [documento]
      );

      // 12. Insertar los nuevos roles (incluyendo "usuario" que siempre debe estar)
      for (const rolId of rolesFinales) {
        await query(`
          INSERT INTO rol_persona (rol_id, doc_persona, sede_id)
          VALUES ($1, $2, $3)
        `, [rolId, documento, sedeId]);
      }

      // 11. Commit de la transacción
      await query('COMMIT');

      console.log(`✅ Roles actualizados para persona ${documento} por admin ${decoded.id}`);

      // 12. Retornar éxito
      return NextResponse.json({
        success: true,
        message: 'Roles actualizados correctamente'
      });

    } catch (error) {
      // Rollback en caso de error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error al asignar roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
