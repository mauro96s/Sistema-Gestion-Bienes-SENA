import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

/**
 * POST /api/auth/login
 * 
 * Endpoint de autenticación - Permite a los usuarios iniciar sesión
 * 
 * FLUJO:
 * 1. Recibe documento y password del cliente
 * 2. Busca el usuario en la base de datos PostgreSQL
 * 3. Verifica la contraseña usando bcrypt
 * 4. Si es correcta, genera un JWT token
 * 5. Retorna el token y los datos del usuario
 * 
 * Body esperado:
 * {
 *   "documento": "1000000001",
 *   "password": "admin123"
 * }
 * 
 * Respuesta exitosa (200):
 * {
 *   "success": true,
 *   "user": { id, nombre, correo, rol, ... },
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Respuesta de error (401):
 * {
 *   "error": "Credenciales incorrectas"
 * }
 */
export async function POST(request) {
  try {
    // 1. Obtener datos del body
    const { documento, password } = await request.json();

    // 2. Validar que existan documento y password
    if (!documento || !password) {
      return NextResponse.json(
        { error: 'Documento y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // 3. Buscar persona en la base de datos por documento
    const result = await query(
      'SELECT * FROM persona WHERE documento = $1',
      [documento]
    );

    // Si no se encontró la persona
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    const persona = result.rows[0];

    // 4. Verificar contraseña con bcrypt
    // Nota: La columna en BD es 'contraseña', pero en el objeto JS puede venir como 'contraseña'
    const passwordMatch = await comparePassword(password, persona.contraseña);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // 5. Obtener roles de la persona
    // Ordenar por prioridad: coordinador > administrador > cuentadante > almacenista > vigilante > usuario
    const rolesQuery = await query(`
      SELECT r.id, r.nombre, rp.sede_id
      FROM rol r
      INNER JOIN rol_persona rp ON r.id = rp.rol_id
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
    `, [persona.documento]);

    if (rolesQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Error: Usuario sin rol asignado' },
        { status: 500 }
      );
    }

    // Asumimos el primer rol como principal por defecto
    const rolPrincipal = rolesQuery.rows[0];
    // Roles disponibles son todos EXCEPTO el rol actual
    const rolesDisponibles = rolesQuery.rows.filter(r => r.id !== rolPrincipal.id);

    // 6. Generar JWT token
    const token = generateToken({
      id: persona.documento, // Usamos documento como ID
      documento: persona.documento,
      correo: persona.correo,
      nombre: `${persona.nombres} ${persona.apellidos}`,
      rol: rolPrincipal.nombre
    });

    // 7. Preparar respuesta (sin enviar la contraseña)
    const { contraseña: _, ...personaWithoutPassword } = persona;

    // 8. Crear respuesta
    const response = NextResponse.json({
      success: true,
      user: {
        ...personaWithoutPassword,
        id: persona.documento, // Alias para compatibilidad frontend
        nombre: `${persona.nombres} ${persona.apellidos}`, // Alias para compatibilidad
        correo: persona.correo,
        rol: rolPrincipal.nombre,
        rolActual: rolPrincipal,
        rolesDisponibles: rolesDisponibles // Solo roles diferentes al actual
      },
      token
    });

    // 9. Guardar token en cookie HttpOnly
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('✅ Login exitoso:', persona.documento, '-', rolPrincipal.nombre);

    return response;

  } catch (error) {
    console.error('❌ Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
