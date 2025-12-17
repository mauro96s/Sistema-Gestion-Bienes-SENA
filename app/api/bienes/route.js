import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Query optimizada para la nueva estructura
    // Obtenemos el estado más reciente y la asignación más reciente mediante subconsultas
    let sqlQuery = `
      SELECT 
        b.id,
        b.placa,
        b.descripcion,
        b.modelo,
        b.serial,
        b.costo,
        b.fecha_compra,
        b.vida_util,
        m.nombre as marca,
        COALESCE(
          (SELECT estado FROM estado_bien WHERE bien_id = b.id ORDER BY fecha_registro DESC LIMIT 1),
          'desconocido'
        ) as estado,
        (SELECT fecha_registro FROM estado_bien WHERE bien_id = b.id ORDER BY fecha_registro DESC LIMIT 1) as fecha_estado,
        (
          SELECT p.nombres || ' ' || p.apellidos 
          FROM asignaciones a 
          JOIN persona p ON a.doc_persona = p.documento 
          WHERE a.bien_id = b.id 
          ORDER BY a.fecha_asignacion DESC LIMIT 1
        ) as responsable,
        (
          SELECT amb.nombre
          FROM asignaciones a 
          JOIN ambientes amb ON a.ambiente_id = amb.id
          WHERE a.bien_id = b.id 
          ORDER BY a.fecha_asignacion DESC LIMIT 1
        ) as ambiente,
        (
          SELECT s.nombre
          FROM asignaciones a 
          JOIN ambientes amb ON a.ambiente_id = amb.id
          JOIN sedes s ON amb.sede_id = s.id
          WHERE a.bien_id = b.id 
          ORDER BY a.fecha_asignacion DESC LIMIT 1
        ) as sede
      FROM bienes b
      LEFT JOIN marcas m ON b.marca_id = m.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (search) {
      sqlQuery += ` AND (
        b.placa ILIKE $${paramCount} OR 
        b.descripcion ILIKE $${paramCount} OR
        b.modelo ILIKE $${paramCount} OR
        b.serial ILIKE $${paramCount} OR
        m.nombre ILIKE $${paramCount} OR
        EXISTS (
          SELECT 1 FROM asignaciones a2
          JOIN persona p2 ON a2.doc_persona = p2.documento
          WHERE a2.bien_id = b.id 
          AND (p2.nombres ILIKE $${paramCount} OR p2.apellidos ILIKE $${paramCount})
        )
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    sqlQuery += ' ORDER BY b.id DESC';

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      bienes: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('Error al obtener bienes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los bienes' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    const requiredFields = ['placa', 'descripcion', 'marca_id', 'costo'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    // Iniciar transacción
    await query('BEGIN');

    try {
      // 1. Insertar en bienes
      const insertBienQuery = `
        INSERT INTO bienes (
          placa, descripcion, modelo, marca_id, serial,
          costo, fecha_compra, vida_util
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const bienValues = [
        body.placa,
        body.descripcion,
        body.modelo || null,
        parseInt(body.marca_id),
        body.serial || null,
        parseFloat(body.costo),
        body.fecha_compra || null,
        body.vida_util ? parseInt(body.vida_util) : null
      ];

      const bienResult = await query(insertBienQuery, bienValues);
      const nuevoBien = bienResult.rows[0];

      // 2. Insertar estado inicial en estado_bien
      const estadoInicial = body.estado_inicial || 'buen_estado';

      await query(
        'INSERT INTO estado_bien (bien_id, estado) VALUES ($1, $2)',
        [nuevoBien.id, estadoInicial]
      );

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        bien: nuevoBien,
        message: 'Bien registrado exitosamente'
      });

    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('Error al registrar bien:', error);

    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { success: false, error: 'La placa ya existe en el sistema' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al registrar el bien', details: error.message },
      { status: 500 }
    );
  }
}
export async function PUT(request) {
  try {
    const body = await request.json();

    // Validar ID
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID del bien requerido' },
        { status: 400 }
      );
    }

    // Validar campos requeridos mínimos
    if (!body.placa || !body.descripcion || !body.marca_id || !body.costo) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    await query('BEGIN');

    try {
      // 1. Actualizar datos básicos
      const updateQuery = `
        UPDATE bienes 
        SET 
          placa = $1,
          descripcion = $2,
          modelo = $3,
          marca_id = $4,
          serial = $5,
          costo = $6,
          fecha_compra = $7,
          vida_util = $8
        WHERE id = $9
        RETURNING *
      `;

      const values = [
        body.placa,
        body.descripcion,
        body.modelo || null,
        parseInt(body.marca_id),
        body.serial || null,
        parseFloat(body.costo),
        body.fecha_compra || null,
        body.vida_util ? parseInt(body.vida_util) : null,
        body.id
      ];

      const result = await query(updateQuery, values);

      if (result.rowCount === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Bien no encontrado' },
          { status: 404 }
        );
      }

      // 2. Verificar si el estado cambió para registrar historial
      if (body.estado) {
        // Obtener último estado
        const lastStateQuery = `
          SELECT estado FROM estado_bien 
          WHERE bien_id = $1 
          ORDER BY fecha_registro DESC LIMIT 1
        `;
        const lastStateRes = await query(lastStateQuery, [body.id]);
        const currentState = lastStateRes.rows[0]?.estado;

        if (currentState !== body.estado) {
          await query(
            'INSERT INTO estado_bien (bien_id, estado) VALUES ($1, $2)',
            [body.id, body.estado]
          );
        }
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        bien: result.rows[0],
        message: 'Bien actualizado correctamente'
      });

    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('Error updating bien:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'La placa ya está registrada en otro bien' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el bien' },
      { status: 500 }
    );
  }
}
