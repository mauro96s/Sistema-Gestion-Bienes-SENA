import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");
    const search = searchParams.get("search") || "";
    const estadoFilter = searchParams.get("estado") || "";

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    let sqlQuery = `
      SELECT 
        b.id,
        b.placa as codigo,
        b.descripcion as nombre,
        b.descripcion,
        m.nombre as marca_nombre,
        m.nombre as marca,
        b.modelo,
        b.serial,
        b.fecha_compra,
        (SELECT estado FROM estado_bien WHERE bien_id = b.id ORDER BY fecha_registro DESC LIMIT 1) as estado_bien,
        a.bloqueado,
        CASE 
          WHEN a.bloqueado = true THEN 'en_prestamo'
          ELSE 'disponible'
        END as estado,
        amb.nombre as ambiente,
        s.nombre as sede,
        a.fecha_asignacion
      FROM asignaciones a
      INNER JOIN bienes b ON a.bien_id = b.id
      LEFT JOIN marcas m ON b.marca_id = m.id
      LEFT JOIN ambientes amb ON a.ambiente_id = amb.id
      LEFT JOIN sedes s ON amb.sede_id = s.id
      WHERE a.doc_persona = $1
    `;

    const params = [usuarioId];
    let paramCount = 2;

    // Filtro de búsqueda
    if (search) {
      sqlQuery += ` AND (
        b.placa ILIKE $${paramCount} OR 
        b.descripcion ILIKE $${paramCount} OR
        b.modelo ILIKE $${paramCount} OR
        b.serial ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filtro de estado
    if (estadoFilter) {
      if (estadoFilter === 'disponible') {
        sqlQuery += ` AND a.bloqueado = false`;
      } else if (estadoFilter === 'en_prestamo') {
        sqlQuery += ` AND a.bloqueado = true`;
      }
    }

    sqlQuery += " ORDER BY a.fecha_asignacion DESC";

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      bienes: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener mis bienes:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar los bienes" },
      { status: 500 }
    );
  }
}
