import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/administrador/roles
 * 
 * Obtiene la lista de todos los roles disponibles en el sistema
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

    // 3. Obtener todos los roles
    const rolesResult = await query(`
      SELECT id, nombre
      FROM rol
      ORDER BY 
        CASE nombre
          WHEN 'administrador' THEN 1
          WHEN 'coordinador' THEN 2
          WHEN 'cuentadante' THEN 3
          WHEN 'almacenista' THEN 4
          WHEN 'vigilante' THEN 5
          WHEN 'usuario' THEN 6
          ELSE 7
        END ASC
    `);

    // 4. Retornar lista de roles
    return NextResponse.json({
      success: true,
      roles: rolesResult.rows
    });

  } catch (error) {
    console.error('❌ Error al obtener roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
