/**
 * SCRIPT 1: RESET COMPLETO DE BASE DE DATOS
 * 
 * Funciones:
 * - Elimina TODOS los datos de todas las tablas
 * - Reinicia los AUTO_INCREMENT (secuencias)
 * - Deja la base de datos completamente limpia
 * 
 * ⚠️ ADVERTENCIA: Este script elimina TODOS los datos
 * 
 * Uso: node scripts/1-reset-database.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool(
    process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || 'sena_bienes',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '123456',
        }
);

async function resetDatabase() {
    try {
        console.log('🧹 INICIANDO RESET COMPLETO DE BASE DE DATOS...\n');
        console.log('⚠️  ADVERTENCIA: Se eliminarán TODOS los datos\n');

        // 1. Eliminar datos de todas las tablas (en orden correcto por dependencias)
        console.log('1️⃣ Eliminando datos de todas las tablas...');
        
        const tablesToClean = [
            'firma_solicitud',
            'detalle_solicitud', 
            'solicitudes',
            'asignaciones',
            'estado_bien',
            'bienes',
            'rol_persona',
            'persona',
            'rol',
            'ambientes',
            'sedes',
            'marcas'
        ];

        for (const table of tablesToClean) {
            await pool.query(`DELETE FROM ${table}`);
            console.log(`   ✅ Tabla ${table} limpiada`);
        }

        // 2. Reiniciar secuencias (AUTO_INCREMENT)
        console.log('\n2️⃣ Reiniciando secuencias (AUTO_INCREMENT)...');
        
        const sequencesToReset = [
            'sedes_id_seq',
            'ambientes_id_seq', 
            'marcas_id_seq',
            'rol_id_seq',
            'bienes_id_seq',
            'asignaciones_id_seq',
            'solicitudes_id_seq',
            'detalle_solicitud_id_seq',
            'firma_solicitud_id_seq',
            'estado_bien_id_seq'
        ];

        for (const sequence of sequencesToReset) {
            try {
                await pool.query(`ALTER SEQUENCE ${sequence} RESTART WITH 1`);
                console.log(`   ✅ Secuencia ${sequence} reiniciada`);
            } catch (error) {
                // Algunas secuencias pueden no existir, continuar
                console.log(`   ⚠️  Secuencia ${sequence} no encontrada (normal)`);
            }
        }

        // 3. Verificar que todo esté limpio
        console.log('\n3️⃣ Verificando limpieza...');
        
        for (const table of tablesToClean) {
            const result = await pool.query(`SELECT COUNT(*) as total FROM ${table}`);
            const count = parseInt(result.rows[0].total);
            console.log(`   ${table}: ${count} registros`);
        }

        console.log('\n✅ BASE DE DATOS COMPLETAMENTE LIMPIA');
        console.log('📋 Siguiente paso: Ejecutar script 2-setup-basic-data.js');

    } catch (error) {
        console.error('❌ Error durante el reset:', error.message);
        console.log('\n💡 Asegúrate de que:');
        console.log('   - La base de datos esté corriendo');
        console.log('   - Las credenciales en .env.local sean correctas');
        console.log('   - Tengas permisos para eliminar datos');
    } finally {
        await pool.end();
    }
}

resetDatabase();