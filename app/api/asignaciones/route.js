import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    const { cuentadante_id, ambiente_id, bienes_ids } = body;
    
    if (!cuentadante_id || !ambiente_id || !bienes_ids || !Array.isArray(bienes_ids) || bienes_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos o bienes_ids debe ser un array con al menos un elemento' },
        { status: 400 }
      );
    }

    const asignacionesCreadas = [];
    const errores = [];

    // Procesar cada bien
    for (const bien_id of bienes_ids) {
      try {
        // Verificar que el bien exista
        const checkBienQuery = `
          SELECT b.id, b.placa, b.descripcion,
                 (SELECT estado FROM estado_bien WHERE bien_id = b.id ORDER BY fecha_registro DESC LIMIT 1) as estado
          FROM bienes b
          WHERE b.id = $1
        `;
        const bienResult = await query(checkBienQuery, [bien_id]);

        if (bienResult.rowCount === 0) {
          errores.push({ bien_id, error: 'Bien no encontrado' });
          continue;
        }

        const bien = bienResult.rows[0];

        // Verificar si ya tiene una asignación activa
        const checkAsignacionQuery = `
          SELECT id FROM asignaciones 
          WHERE bien_id = $1 
          ORDER BY fecha_asignacion DESC 
          LIMIT 1
        `;
        const asignacionExistente = await query(checkAsignacionQuery, [bien_id]);
        
        if (asignacionExistente.rowCount > 0) {
          errores.push({ 
            bien_id, 
            placa: bien.placa,
            error: 'El bien ya tiene una asignación' 
          });
          continue;
        }

        // Crear nueva asignación
        const insertAsignacionQuery = `
          INSERT INTO asignaciones (
            bien_id, doc_persona, ambiente_id, bloqueado
          ) VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        
        const asignacionResult = await query(insertAsignacionQuery, [
          bien_id,
          cuentadante_id, // Este es el documento de la persona
          ambiente_id,
          false // Por defecto, el bien está disponible para préstamo
        ]);

        asignacionesCreadas.push({
          asignacion: asignacionResult.rows[0],
          bien: { id: bien.id, placa: bien.placa, descripcion: bien.descripcion }
        });

      } catch (error) {
        console.error(`Error procesando bien ${bien_id}:`, error);
        errores.push({ bien_id, error: error.message });
      }
    }

    // Respuesta final
    if (asignacionesCreadas.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se pudo asignar ningún bien',
          errores 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${asignacionesCreadas.length} bien(es) asignado(s) exitosamente`,
      asignaciones: asignacionesCreadas,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('Error al crear asignaciones:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear las asignaciones',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bien_id = searchParams.get('bien_id');
    const cuentadante_id = searchParams.get('cuentadante_id');

    let sqlQuery = `
      SELECT 
        a.id,
        a.bien_id,
        a.doc_persona,
        a.ambiente_id,
        a.bloqueado,
        a.fecha_asignacion,
        b.placa as bien_placa,
        b.descripcion as bien_descripcion,
        p.nombres || ' ' || p.apellidos as cuentadante_nombre,
        amb.nombre as ambiente_nombre
      FROM asignaciones a
      LEFT JOIN bienes b ON a.bien_id = b.id
      LEFT JOIN persona p ON a.doc_persona = p.documento
      LEFT JOIN ambientes amb ON a.ambiente_id = amb.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (bien_id) {
      sqlQuery += ` AND a.bien_id = $${paramCount}`;
      params.push(parseInt(bien_id));
      paramCount++;
    }

    if (cuentadante_id) {
      sqlQuery += ` AND a.doc_persona = $${paramCount}`;
      params.push(cuentadante_id);
      paramCount++;
    }

    sqlQuery += ' ORDER BY a.fecha_asignacion DESC';

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      asignaciones: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener las asignaciones',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
