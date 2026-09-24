import { query, getClient } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

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
          SELECT CONCAT(p.nombres, ' ', p.apellidos) 
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

    if (search) {
      sqlQuery += ` AND (
        b.placa LIKE ? OR 
        b.descripcion LIKE ? OR
        b.modelo LIKE ? OR
        b.serial LIKE ? OR
        m.nombre LIKE ? OR
        EXISTS (
          SELECT 1 FROM asignaciones a2
          JOIN persona p2 ON a2.doc_persona = p2.documento
          WHERE a2.bien_id = b.id 
          AND (p2.nombres LIKE ? OR p2.apellidos LIKE ?)
        )
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
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
  let client;
  try {
    const body = await request.json();
    const requiredFields = ['placa', 'descripcion', 'marca_id', 'costo'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Campo requerido: ${field}` }, { status: 400 });
      }
    }

    client = await getClient();
    await client.query('START TRANSACTION');

    const insertBienQuery = `
      INSERT INTO bienes (
        placa, descripcion, modelo, marca_id, serial,
        costo, fecha_compra, vida_util
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

    const bienResult = await client.query(insertBienQuery, bienValues);
    const bienId = bienResult.rows[0].id;

    // Normalizar estado (buen_estado, deteriorado, en_mantenimiento, en_prestamo, dado_de_baja)
    let estadoInicial = (body.estado_inicial || 'buen_estado').toLowerCase().trim().replace(/\s+/g, '_');
    
    // Mapeo de compatibilidad
    if (estadoInicial === 'dañado') estadoInicial = 'deteriorado';
    
    await client.query(
      'INSERT INTO estado_bien (bien_id, estado) VALUES (?, ?)',
      [bienId, estadoInicial]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      bien: { id: bienId, ...body },
      message: 'Bien registrado exitosamente'
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al registrar bien:', error);
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return NextResponse.json({ success: false, error: 'La placa ya existe' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function PUT(request) {
  let client;
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID del bien requerido' }, { status: 400 });
    }

    client = await getClient();
    await client.query('START TRANSACTION');

    const updateQuery = `
      UPDATE bienes 
      SET 
        placa = ?,
        descripcion = ?,
        modelo = ?,
        marca_id = ?,
        serial = ?,
        costo = ?,
        fecha_compra = ?,
        vida_util = ?
      WHERE id = ?
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

    const result = await client.query(updateQuery, values);

    if (body.estado) {
      // Normalizar estado para MySQL
      let estadoNormalizado = body.estado.toLowerCase().trim().replace(/\s+/g, '_');
      
      // Mapeo de compatibilidad
      if (estadoNormalizado === 'dañado') estadoNormalizado = 'deteriorado';
      
      const lastStateRes = await client.query(`
        SELECT estado FROM estado_bien 
        WHERE bien_id = ? 
        ORDER BY fecha_registro DESC LIMIT 1
      `, [body.id]);
      
      const currentState = lastStateRes.rows[0]?.estado;

      if (currentState !== estadoNormalizado) {
        await client.query(
          'INSERT INTO estado_bien (bien_id, estado) VALUES (?, ?)',
          [body.id, estadoNormalizado]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Bien actualizado correctamente'
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error updating bien:', error);
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return NextResponse.json({ success: false, error: 'La placa ya está registrada' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
