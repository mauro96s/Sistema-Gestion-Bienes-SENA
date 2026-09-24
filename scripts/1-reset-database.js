/**
 * SCRIPT 1: RESET COMPLETO DE BASE DE DATOS (MySQL)
 * 
 * Funciones:
 * - Elimina TODOS los datos de todas las tablas
 * - Reinicia los AUTO_INCREMENT
 * - Deja la base de datos completamente limpia
 * 
 * ⚠️ ADVERTENCIA: Este script elimina TODOS los datos
 * 
 * Uso: node scripts/1-reset-database.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'sena_bienes',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Importante para ejecutar el archivo .sql completo
};

async function resetDatabase() {
    let connection;
    try {
        console.log('🧹 INICIANDO RESET Y RECONSTRUCCIÓN DE BASE DE DATOS (MySQL)...\n');
        
        connection = await mysql.createConnection(dbConfig);

        // 1. Leer el archivo de esquema
        const schemaPath = path.join(process.cwd(), 'database_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error('No se encontró el archivo database_schema.sql');
        }

        console.log('1️⃣ Ejecutando database_schema.sql...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Ejecutar todo el SQL (DROP y CREATE de todas las tablas)
        await connection.query(schemaSql);
        console.log('   ✅ Esquema de base de datos recreado correctamente');

        // 2. Verificar tablas
        console.log('\n2️⃣ Verificando tablas creadas...');
        const tablesToVerify = [
            'firma_solicitud', 'detalle_solicitud', 'solicitudes',
            'asignaciones', 'estado_bien', 'bienes', 'rol_persona',
            'persona', 'rol', 'ambientes', 'sedes', 'marcas'
        ];
        
        for (const table of tablesToVerify) {
            const [rows] = await connection.query(`SELECT COUNT(*) as total FROM ${table}`);
            console.log(`   ${table}: ${rows[0].total} registros`);
        }

        console.log('\n✅ BASE DE DATOS COMPLETAMENTE LIMPIA');
        console.log('📋 Siguiente paso: Ejecutar script 2-setup-basic-data.js');

    } catch (error) {
        console.error('❌ Error durante el reset:', error.message);
        console.log('\n💡 Asegúrate de que:');
        console.log('   - MySQL esté corriendo');
        console.log('   - La base de datos "' + dbConfig.database + '" exista');
        console.log('   - Las credenciales en .env.local sean correctas');
    } finally {
        if (connection) await connection.end();
    }
}

resetDatabase();