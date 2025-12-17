import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateToken, verifyToken } from '@/lib/auth';

/**
 * POST /api/auth/cambiar-rol
 * 
 * Permite cambiar de rol sin cerrar sesión
 * Solo puede cambiar a roles que el usuario tiene asignados
 */
export async function POST(request) {
  try {
    // 1. Obtener token de la cookie
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // 2. Verificar token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // 3. Obtener el ID del nuevo rol
    const { nuevoRolId } = await request.json();

    if (!nuevoRolId) {
      return NextResponse.json(
        { error: 'Se requiere nuevoRolId' },
        { status: 400 }
      );
    }

    // 4. Verificar que la persona TENGA ese rol asignado
    const verificacion = await query(`
      SELECT r.id, r.nombre, rp.sede_id
      FROM rol r
      INNER JOIN rol_persona rp ON r.id = rp.rol_id
      WHERE rp.doc_persona = $1 AND r.id = $2
    `, [decoded.documento, nuevoRolId]);

    if (verificacion.rows.length === 0) {
      console.warn(`⚠️ Usuario ${decoded.documento} intentó cambiar a rol ${nuevoRolId} sin permiso`);
      return NextResponse.json(
        { error: 'No tienes permiso para usar ese rol' },
        { status: 403 }
      );
    }

    const nuevoRol = verificacion.rows[0];

    // 5. Obtener datos de la persona
    const personaResult = await query(
      'SELECT * FROM persona WHERE documento = $1',
      [decoded.documento]
    );

    if (personaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const persona = personaResult.rows[0];
    const { contraseña: _, ...personaWithoutPassword } = persona;

    // 6. Generar nuevo token con el nuevo rol
    const nuevoToken = generateToken({
      id: persona.documento,
      documento: persona.documento,
      correo: persona.correo,
      nombre: `${persona.nombres} ${persona.apellidos}`,
      rol: nuevoRol.nombre
    });

    // 7. Obtener todos los roles para actualizar rolesDisponibles
    const rolesResult = await query(`
      SELECT r.id, r.nombre, rp.sede_id
      FROM rol r
      INNER JOIN rol_persona rp ON r.id = rp.rol_id
      WHERE rp.doc_persona = $1
    `, [persona.documento]);

    const rolesSecundarios = rolesResult.rows.filter(r => r.id !== nuevoRol.id);

    // 8. Crear respuesta
    const response = NextResponse.json({
      success: true,
      user: {
        ...personaWithoutPassword,
        id: persona.documento,
        nombre: `${persona.nombres} ${persona.apellidos}`,
        correo: persona.correo,
        rol: nuevoRol.nombre,
        rolActual: nuevoRol,
        rolesDisponibles: rolesSecundarios
      },
      token: nuevoToken
    });

    // 9. Actualizar cookie
    response.cookies.set('token', nuevoToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log(`✅ Usuario ${persona.documento} cambió a rol:`, nuevoRol.nombre);

    return response;

  } catch (error) {
    console.error('❌ Error al cambiar rol:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
