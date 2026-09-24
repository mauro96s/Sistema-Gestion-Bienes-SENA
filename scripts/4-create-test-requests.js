/**
 * SCRIPT 4: CREACIÓN DE SOLICITUDES DE PRUEBA (MySQL)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'sena_bienes',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
};

async function createTestRequests() {
    let connection;
    try {
        console.log('📝 CREANDO SOLICITUDES DE PRUEBA (MySQL)...\n');
        connection = await mysql.createConnection(dbConfig);

        // 1. Obtener datos necesarios
        const [usuarios] = await connection.execute("SELECT documento FROM persona WHERE correo = 'usuario@sena.edu.co'");
        if (usuarios.length === 0) throw new Error('No se encontró el usuario regular (usuario@sena.edu.co)');
        const usuarioDoc = usuarios[0].documento;

        const [bienes] = await connection.execute(`
            SELECT b.id, b.placa, s.id as sede_id, a.id as asignacion_id
            FROM bienes b
            JOIN asignaciones a ON b.id = a.bien_id
            JOIN ambientes amb ON a.ambiente_id = amb.id
            JOIN sedes s ON amb.sede_id = s.id
        `);

        const [cuentadantes] = await connection.execute(`
            SELECT rp.doc_persona as documento, rp.sede_id 
            FROM rol_persona rp JOIN rol r ON rp.rol_id = r.id 
            WHERE r.nombre = 'cuentadante'
        `);
        
        const [coordinadores] = await connection.execute(`
            SELECT rp.doc_persona as documento, rp.sede_id 
            FROM rol_persona rp JOIN rol r ON rp.rol_id = r.id 
            WHERE r.nombre = 'coordinador'
        `);

        const [vigilantes] = await connection.execute(`
            SELECT rp.doc_persona as documento, rp.sede_id 
            FROM rol_persona rp JOIN rol r ON rp.rol_id = r.id 
            WHERE r.nombre = 'vigilante'
        `);

        console.log('2️⃣ Generando 15 solicitudes en diferentes estados...');
        const estados = ['pendiente', 'firmada_cuentadante', 'aprobada', 'en_prestamo', 'devuelto', 'rechazada', 'cancelada'];
        
        for (let i = 0; i < 15; i++) {
            const estado = estados[i % estados.length];
            const bien = bienes[i % bienes.length];
            const sedeId = bien.sede_id;

            // Crear solicitud
            const [solResult] = await connection.execute(`
                INSERT INTO solicitudes (doc_persona, sede_id, destino, motivo, estado, fecha_ini_prestamo, fecha_fin_prestamo) 
                VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_ADD(NOW(), INTERVAL ? DAY))
            `, [usuarioDoc, sedeId, `Ambiente Prueba ${i+1}`, `Motivo de prueba ${i+1}`, estado, (15 - i), (i + 5)]);

            const solicitudId = solResult.insertId;

            // Detalle
            await connection.execute("INSERT INTO detalle_solicitud (solicitud_id, asignacion_id) VALUES (?, ?)", 
                [solicitudId, bien.asignacion_id]);

            // Simular flujo de firmas
            let flujo = [];
            if (estado === 'firmada_cuentadante') flujo = ['cuentadante'];
            if (estado === 'aprobada') flujo = ['cuentadante', 'coordinador'];
            if (estado === 'en_prestamo') flujo = ['cuentadante', 'coordinador', 'vigilante'];
            if (estado === 'devuelto') flujo = ['cuentadante', 'coordinador', 'vigilante', 'vigilante'];

            for (const rol of flujo) {
                let firmante;
                if (rol === 'cuentadante') firmante = cuentadantes.find(u => u.sede_id === sedeId) || cuentadantes[0];
                if (rol === 'coordinador') firmante = coordinadores.find(u => u.sede_id === sedeId) || coordinadores[0];
                if (rol === 'vigilante') firmante = vigilantes.find(u => u.sede_id === sedeId) || vigilantes[0];

                if (firmante) {
                    await connection.execute(`
                        INSERT INTO firma_solicitud (solicitud_id, doc_persona, rol_usuario, firma, observacion) 
                        VALUES (?, ?, ?, 1, 'Firma automática de prueba')
                    `, [solicitudId, firmante.documento, rol]);
                }
            }

            // Actualizar bloqueo de bien si es necesario
            if (['firmada_cuentadante', 'aprobada', 'en_prestamo'].includes(estado)) {
                await connection.execute("UPDATE asignaciones SET bloqueado = 1 WHERE id = ?", [bien.asignacion_id]);
            }
        }

        console.log('\n✅ SOLICITUDES DE PRUEBA CREADAS EXITOSAMENTE');
    } catch (error) {
        console.error('❌ Error creando solicitudes:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

createTestRequests();