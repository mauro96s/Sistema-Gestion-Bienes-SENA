require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function debug() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'sena_bienes'
  });

  try {
    const solicitudId = process.argv[2];
    if (!solicitudId) {
      console.log('Uso: node scripts/debug-solicitud.cjs <ID_SOLICITUD>');
      return;
    }

    console.log(`🔍 Inspeccionando solicitud #${solicitudId}...`);

    // 1. Ver solicitud
    const [sol] = await connection.query('SELECT * FROM solicitudes WHERE id = ?', [solicitudId]);
    console.log('\n--- SOLICITUD ---');
    console.table(sol);

    // 2. Ver detalles
    const [det] = await connection.query('SELECT * FROM detalle_solicitud WHERE solicitud_id = ?', [solicitudId]);
    console.log('\n--- DETALLE_SOLICITUD ---');
    console.table(det);

    if (det.length > 0) {
      const asignacionIds = det.map(d => d.asignacion_id);
      const [asig] = await connection.query(`SELECT * FROM asignaciones WHERE id IN (${asignacionIds.join(',')})`);
      console.log('\n--- ASIGNACIONES VINCULADAS ---');
      console.table(asig);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

debug();
