import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Listar todas las personas que tienen el rol de cuentadante
    const sqlQuery = `
      SELECT DISTINCT 
        p.documento as id,
        p.nombres,
        p.apellidos,
        p.nombres || ' ' || p.apellidos as nombre,
        p.correo as email,
        rp.sede_id,
        s.nombre as sede_nombre
      FROM persona p
      INNER JOIN rol_persona rp ON p.documento = rp.doc_persona
      INNER JOIN rol r ON rp.rol_id = r.id
      LEFT JOIN sedes s ON rp.sede_id = s.id
      WHERE r.nombre = 'cuentadante'
      ORDER BY p.nombres ASC, p.apellidos ASC
    `;

    const result = await query(sqlQuery);

    return NextResponse.json({
      success: true,
      cuentadantes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener cuentadantes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar cuentadantes' },
      { status: 500 }
    );
  }
}
