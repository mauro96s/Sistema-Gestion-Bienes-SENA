import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * POST /api/auth/register
 * 
 * Endpoint de registro - Permite a nuevos usuarios registrarse
 * Todos los usuarios nuevos se registran con el rol "usuario" por defecto
 * 
 * Body esperado:
 * {
 *   "documento": "1234567890",
 *   "tipo_doc": "CC",
 *   "nombres": "Juan",
 *   "apellidos": "Pérez",
 *   "correo": "juan@example.com",
 *   "password": "password123",
 *   "telefono": "3001234567",
 *   "direccion": "Calle 123"
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      documento, 
      tipo_doc, 
      nombres, 
      apellidos, 
      correo, 
      password,
      telefono,
      direccion 
    } = body;

    // 1. Validar campos requeridos
    if (!documento || !tipo_doc || !nombres || !apellidos || !correo || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // 2. Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return NextResponse.json(
        { error: 'Formato de correo inválido' },
        { status: 400 }
      );
    }

    // 3. Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // 4. Verificar si el documento ya existe
    const documentoExiste = await query(
      'SELECT documento FROM persona WHERE documento = $1',
      [documento]
    );

    if (documentoExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'El documento ya está registrado' },
        { status: 400 }
      );
    }

    // 5. Verificar si el correo ya existe
    const correoExiste = await query(
      'SELECT correo FROM persona WHERE correo = $1',
      [correo]
    );

    if (correoExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'El correo ya está registrado' },
        { status: 400 }
      );
    }

    // 6. Hashear la contraseña
    const hashedPassword = await hashPassword(password);

    // 7. Iniciar transacción
    await query('BEGIN');

    try {
      // 8. Insertar la persona
      await query(`
        INSERT INTO persona (documento, tipo_doc, nombres, apellidos, correo, contraseña, telefono, direccion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [documento, tipo_doc, nombres, apellidos, correo, hashedPassword, telefono || null, direccion || null]);

      // 9. Obtener el ID del rol "usuario"
      const rolResult = await query(
        'SELECT id FROM rol WHERE nombre = $1',
        ['usuario']
      );

      if (rolResult.rows.length === 0) {
        throw new Error('Rol "usuario" no encontrado en el sistema');
      }

      const rolUsuarioId = rolResult.rows[0].id;

      // 10. Obtener una sede por defecto
      const sedeResult = await query('SELECT id FROM sedes LIMIT 1');
      
      if (sedeResult.rows.length === 0) {
        throw new Error('No hay sedes disponibles en el sistema');
      }

      const sedeId = sedeResult.rows[0].id;

      // 11. Asignar el rol "usuario" por defecto
      await query(`
        INSERT INTO rol_persona (rol_id, doc_persona, sede_id)
        VALUES ($1, $2, $3)
      `, [rolUsuarioId, documento, sedeId]);

      // 12. Commit de la transacción
      await query('COMMIT');

      console.log('✅ Usuario registrado:', documento, '-', correo);

      // 13. Retornar éxito
      return NextResponse.json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          documento,
          nombres,
          apellidos,
          correo
        }
      });

    } catch (error) {
      // Rollback en caso de error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error en registro:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
