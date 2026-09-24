require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'sena_bienes'
  });

  try {
    console.log('🔧 Corrigiendo restricciones de estado_bien...');
    
    // 1. Eliminar la restricción vieja
    await connection.query('ALTER TABLE estado_bien DROP CONSTRAINT chk_estado_bien');
    
    // 2. Añadir la restricción nueva con los valores correctos
    await connection.query(`
      ALTER TABLE estado_bien ADD CONSTRAINT chk_estado_bien 
      CHECK (estado IN ('buen_estado', 'deteriorado', 'en_mantenimiento', 'en_prestamo', 'dado_de_baja'))
    `);

    console.log('✅ Restricción actualizada con éxito.');
    console.log('Valores permitidos ahora: buen_estado, deteriorado, en_mantenimiento, en_prestamo, dado_de_baja');

  } catch (error) {
    console.error('❌ Error al actualizar:', error.message);
  } finally {
    await connection.end();
  }
}

fix();
