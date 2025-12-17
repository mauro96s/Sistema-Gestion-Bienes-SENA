import { query } from '@/lib/db';
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
        p.nombres || ' ' || p.apellidos as solicitante_nombre,
        p.documento as solicitante_documento,
        sed.nombre as sede_nombre,
        (
          SELECT COUNT(*) 
          FROM firma_solicitud fs 
          WHERE fs.solicitud_id = s.id
        ) as firmas_completadas,
        (
          SELECT DISTINCT pc.nombres || ' ' || pc.apellidos
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
      sqlQuery += ` AND s.doc_persona = $${params.length}`;

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
          WHERE rp.doc_persona = $1 AND r.nombre = $2
        `, [documento, rol]);

        if (sedeResult.rows.length > 0 && sedeResult.rows[0].sede_id) {
          params.push(sedeResult.rows[0].sede_id);
          sqlQuery += ` AND s.sede_id = $${params.length}`;
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
  const client = await query('BEGIN');

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
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (!bienes || bienes.length === 0) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Debes seleccionar al menos un bien' },
        { status: 400 }
      );
    }

    // Obtener información de los bienes y agrupar por cuentadante
    const bienesInfo = await query(`
      SELECT 
        a.id as asignacion_id,
        a.doc_persona as cuentadante_documento,
        p.nombres || ' ' || p.apellidos as cuentadante_nombre,
        b.placa
      FROM asignaciones a
      JOIN persona p ON a.doc_persona = p.documento
      JOIN bienes b ON a.bien_id = b.id
      WHERE a.id = ANY($1) AND a.bloqueado = false
    `, [bienes]);

    if (bienesInfo.rows.length !== bienes.length) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Algunos bienes no están disponibles' },
        { status: 400 }
      );
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
      const solicitudResult = await query(`
        INSERT INTO solicitudes (
          doc_persona,
          sede_id,
          fecha_ini_prestamo,
          fecha_fin_prestamo,
          destino,
          motivo,
          observaciones,
          estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente')
        RETURNING id
      `, [
        doc_persona,
        parseInt(sede_id),
        fecha_ini_prestamo,
        fecha_fin_prestamo,
        destino,
        motivo,
        observaciones || null
      ]);

      const solicitudId = solicitudResult.rows[0].id;

      // Insertar detalles (bienes de esta solicitud)
      for (const bien of grupo.bienes) {
        await query(`
          INSERT INTO detalle_solicitud (solicitud_id, asignacion_id)
          VALUES ($1, $2)
        `, [solicitudId, bien.asignacion_id]);
      }

      solicitudesCreadas.push({
        id: solicitudId,
        cuentadante: grupo.cuentadante_nombre,
        bienes: grupo.bienes.length
      });
    }

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `${solicitudesCreadas.length} solicitud(es) creada(s) exitosamente`,
      solicitudesCreadas: solicitudesCreadas.length,
      detalles: solicitudesCreadas
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error al crear solicitudes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud', detail: error.message },
      { status: 500 }
    );
  }
}
