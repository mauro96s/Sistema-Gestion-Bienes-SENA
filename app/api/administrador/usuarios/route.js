import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/administrador/usuarios
 * 
 * Obtiene la lista de todos los usuarios con sus roles asignados
 * Solo accesible para administradores
 */
export async function GET(request) {
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

    // 3. Obtener todas las personas con sus roles
    const usuariosResult = await query(`
      SELECT 
        p.documento as id,
        p.nombres || ' ' || p.apellidos as nombre,
        p.correo as email,
        p.documento,
        p.nombres,
        p.apellidos
      FROM persona p
      ORDER BY p.nombres ASC
    `);

    const usuarios = usuariosResult.rows;

    // 4. Para cada persona, obtener TODOS sus roles
    for (let usuario of usuarios) {
      const rolesResult = await query(`
        SELECT 
          r.id, 
          r.nombre,
          rp.sede_id,
          s.nombre as sede_nombre,
          CASE 
            WHEN COUNT(*) OVER (PARTITION BY rp.doc_persona) = 1 THEN true
            ELSE false
          END as es_principal
        FROM rol r
        INNER JOIN rol_persona rp ON r.id = rp.rol_id
        LEFT JOIN sedes s ON rp.sede_id = s.id
        WHERE rp.doc_persona = $1
        ORDER BY 
          CASE r.nombre
            WHEN 'coordinador' THEN 1
            WHEN 'administrador' THEN 2
            WHEN 'cuentadante' THEN 3
            WHEN 'almacenista' THEN 4
            WHEN 'vigilante' THEN 5
            WHEN 'usuario' THEN 6
            ELSE 7
          END ASC
      `, [usuario.documento]);

      usuario.roles = rolesResult.rows;
      
      // Establecer el rol principal (el primero por prioridad)
      if (rolesResult.rows.length > 0) {
        usuario.rol_principal_id = rolesResult.rows[0].id;
        usuario.rol_principal_nombre = rolesResult.rows[0].nombre;
      }
    }

    // 5. Retornar lista de usuarios
    return NextResponse.json({
      success: true,
      usuarios: usuarios
    });

  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
