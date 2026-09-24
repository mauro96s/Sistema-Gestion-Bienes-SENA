import { query, getClient } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/solicitudes
 * 
 * Obtiene solicitudes según el rol del usuario
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol')?.toLowerCase();
    const documento = searchParams.get('documento');

    let sqlQuery = `
      SELECT DISTINCT
        s.id,
        s.fecha_ini_prestamo,
        s.fecha_fin_prestamo,
        s.destino,
        s.motivo,
        s.estado,
        s.observaciones,
        CONCAT(p.nombres, ' ', p.apellidos) as solicitante_nombre,
        p.documento as solicitante_documento,
        sed.nombre as sede_nombre,
        (
          SELECT COUNT(*) 
          FROM firma_solicitud fs 
          WHERE fs.solicitud_id = s.id
        ) as firmas_completadas,
        (
          SELECT DISTINCT CONCAT(pc.nombres, ' ', pc.apellidos)
          FROM detalle_solicitud ds
          JOIN asignaciones a ON ds.asignacion_id = a.id
          JOIN persona pc ON a.doc_persona = pc.documento
          WHERE ds.solicitud_id = s.id
          LIMIT 1
        ) as cuentadante_nombre
      FROM solicitudes s
      JOIN persona p ON s.doc_persona = p.documento
      LEFT JOIN sedes sed ON s.sede_id = sed.id
      WHERE 1=1
    `;

    const params = [];

    // Lógica de filtrado según rol
    if (rol === 'usuario' && documento) {
      // Usuario ve solo sus solicitudes
      params.push(documento);
      sqlQuery += ` AND s.doc_persona = ?`;

    } else if (rol === 'cuentadante' && documento) {
      // Cuentadante ve solicitudes de bienes bajo su cargo
      params.push(documento);
      sqlQuery += ` AND EXISTS (
        SELECT 1 FROM detalle_solicitud ds
        JOIN asignaciones a ON ds.asignacion_id = a.id
        WHERE ds.solicitud_id = s.id AND a.doc_persona = ?
      )`;

    } else if (rol === 'vigilante' || rol === 'coordinador') {
      if (!documento) {
        // Seguridad: Si tiene rol restringido pero no envía documento, no ve nada
        sqlQuery += ` AND 1=0`;
      } else {
        // Vigilante y Coordinador ven solo solicitudes de su SEDE asignada
        const sedeResult = await query(`
          SELECT rp.sede_id 
          FROM rol_persona rp
          JOIN rol r ON rp.rol_id = r.id
          WHERE rp.doc_persona = ? AND r.nombre = ?
        `, [documento, rol]);

        if (sedeResult.rows.length > 0 && sedeResult.rows[0].sede_id) {
          params.push(sedeResult.rows[0].sede_id);
          sqlQuery += ` AND s.sede_id = ?`;
        } else {
          // Si no tiene sede asignada (o error), forzamos que no vea nada para seguridad
          sqlQuery += ` AND 1=0`;
        }
      }
    }

    sqlQuery += ' ORDER BY s.id DESC';

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      solicitudes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar solicitudes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/solicitudes
 * 
 * Crea solicitudes agrupadas por cuentadante
 * Recibe un array de bienes y los agrupa automáticamente
 */
export async function POST(request) {
  let client;

  try {
    const body = await request.json();
    const {
      doc_persona,
      sede_id,
      fecha_ini_prestamo,
      fecha_fin_prestamo,
      destino,
      motivo,
      observaciones,
      bienes // Array de asignacion_id
    } = body;

    // Validaciones
    if (!doc_persona || !sede_id || !fecha_ini_prestamo || !fecha_fin_prestamo || !destino || !motivo) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (!bienes || bienes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debes seleccionar al menos un bien' },
        { status: 400 }
      );
    }

    client = await getClient();
    await client.query('START TRANSACTION');

    // Obtener información de los bienes y agrupar por cuentadante
    // En MySQL usamos placeholder ? y el array de bienes como parámetro
    // Pero MySQL no expande automáticamente arrays en 'IN (?)', así que usamos una técnica compatible
    const placeholders = bienes.map(() => '?').join(',');
    const bienesInfo = await client.query(`
      SELECT 
        a.id as asignacion_id,
        a.doc_persona as cuentadante_documento,
        CONCAT(p.nombres, ' ', p.apellidos) as cuentadante_nombre,
        b.placa
      FROM asignaciones a
      JOIN persona p ON a.doc_persona = p.documento
      JOIN bienes b ON a.bien_id = b.id
      WHERE a.id IN (${placeholders}) AND a.bloqueado = false
    `, bienes);

    if (bienesInfo.rows.length !== bienes.length) {
      throw new Error('Algunos bienes no están disponibles o ya están bloqueados');
    }

    // Agrupar por cuentadante
    const grupos = bienesInfo.rows.reduce((acc, bien) => {
      const key = bien.cuentadante_documento;
      if (!acc[key]) {
        acc[key] = {
          cuentadante_documento: bien.cuentadante_documento,
          cuentadante_nombre: bien.cuentadante_nombre,
          bienes: []
        };
      }
      acc[key].bienes.push(bien);
      return acc;
    }, {});

    const solicitudesCreadas = [];

    // Crear una solicitud por cada cuentadante
    for (const [cuentadanteDoc, grupo] of Object.entries(grupos)) {
      // Crear solicitud
      const solicitudResult = await client.query(`
        INSERT INTO solicitudes (
          doc_persona,
          sede_id,
          fecha_ini_prestamo,
          fecha_fin_prestamo,
          destino,
          motivo,
          observaciones,
          estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
      `, [
        doc_persona,
        parseInt(sede_id),
        fecha_ini_prestamo,
        fecha_fin_prestamo,
        destino,
        motivo,
        observaciones || null
      ]);

      const solicitudId = solicitudResult.rows[0].id; // insertId mapeado en lib/db.js

      // Insertar detalles (bienes de esta solicitud)
      for (const bien of grupo.bienes) {
        await client.query(`
          INSERT INTO detalle_solicitud (solicitud_id, asignacion_id)
          VALUES (?, ?)
        `, [solicitudId, bien.asignacion_id]);
      }

      solicitudesCreadas.push({
        id: solicitudId,
        cuentadante: grupo.cuentadante_nombre,
        bienes: grupo.bienes.length
      });
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `${solicitudesCreadas.length} solicitud(es) creada(s) exitosamente`,
      solicitudesCreadas: solicitudesCreadas.length,
      detalles: solicitudesCreadas
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al crear solicitudes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
