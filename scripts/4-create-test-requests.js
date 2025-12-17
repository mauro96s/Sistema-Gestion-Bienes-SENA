/**
 * SCRIPT 4: CREACIÓN DE SOLICITUDES DE PRUEBA
 * 
 * Funciones:
 * - Crea solicitudes de diferentes usuarios a diferentes cuentadantes
 * - Genera solicitudes en diferentes estados (pendiente, aprobada, rechazada, firmada)
 * - Simula el flujo completo del sistema
 * - Permite validar vistas de todos los roles
 * 
 * Requisito: Ejecutar después de los scripts 1, 2 y 3
 * 
 * Uso: node scripts/4-create-test-requests.js
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

async function createTestRequests() {
    try {
        console.log('📝 CREANDO SOLICITUDES DE PRUEBA...\n');

        // 1. Obtener datos necesarios
        console.log('1️⃣ Obteniendo datos base...');
        
        // Obtener solo el usuario que tiene ÚNICAMENTE el rol 'usuario' (sin otros roles)
        const usuariosResult = await pool.query(`
            SELECT p.documento, p.nombres, p.apellidos, s.nombre as sede_nombre, s.id as sede_id
            FROM persona p
            JOIN rol_persona rp ON p.documento = rp.doc_persona
            JOIN rol r ON rp.rol_id = r.id
            JOIN sedes s ON rp.sede_id = s.id
            WHERE r.nombre = 'usuario'
            AND p.documento NOT IN (
                SELECT DISTINCT rp2.doc_persona 
                FROM rol_persona rp2 
                JOIN rol r2 ON rp2.rol_id = r2.id 
                WHERE r2.nombre != 'usuario'
            )
            ORDER BY p.nombres
        `);
        const usuarios = usuariosResult.rows;
        console.log(`   ✅ ${usuarios.length} usuario(s) disponible(s) (solo rol usuario)`);

        // Obtener cuentadantes por sede
        const cuentadantesResult = await pool.query(`
            SELECT p.documento, p.nombres, p.apellidos, s.nombre as sede_nombre, s.id as sede_id
            FROM persona p
            JOIN rol_persona rp ON p.documento = rp.doc_persona
            JOIN rol r ON rp.rol_id = r.id
            JOIN sedes s ON rp.sede_id = s.id
            WHERE r.nombre = 'cuentadante'
            ORDER BY s.nombre, p.nombres
        `);
        const cuentadantes = cuentadantesResult.rows;
        console.log(`   ✅ ${cuentadantes.length} cuentadantes disponibles`);

        // Obtener coordinadores por sede
        const coordinadoresResult = await pool.query(`
            SELECT p.documento, p.nombres, p.apellidos, s.nombre as sede_nombre, s.id as sede_id
            FROM persona p
            JOIN rol_persona rp ON p.documento = rp.doc_persona
            JOIN rol r ON rp.rol_id = r.id
            JOIN sedes s ON rp.sede_id = s.id
            WHERE r.nombre = 'coordinador'
            ORDER BY s.nombre, p.nombres
        `);
        const coordinadores = coordinadoresResult.rows;
        console.log(`   ✅ ${coordinadores.length} coordinadores disponibles`);

        // Obtener vigilantes por sede
        const vigilantesResult = await pool.query(`
            SELECT p.documento, p.nombres, p.apellidos, s.nombre as sede_nombre, s.id as sede_id
            FROM persona p
            JOIN rol_persona rp ON p.documento = rp.doc_persona
            JOIN rol r ON rp.rol_id = r.id
            JOIN sedes s ON rp.sede_id = s.id
            WHERE r.nombre = 'vigilante'
            ORDER BY s.nombre, p.nombres
        `);
        const vigilantes = vigilantesResult.rows;
        console.log(`   ✅ ${vigilantes.length} vigilantes disponibles`);

        // Obtener bienes asignados por sede
        const bienesResult = await pool.query(`
            SELECT b.id, b.placa, b.descripcion, s.nombre as sede_nombre, s.id as sede_id,
                   p.documento as cuentadante_doc, p.nombres as cuentadante_nombres
            FROM bienes b
            JOIN asignaciones a ON b.id = a.bien_id
            JOIN ambientes amb ON a.ambiente_id = amb.id
            JOIN sedes s ON amb.sede_id = s.id
            JOIN persona p ON a.doc_persona = p.documento
            ORDER BY s.nombre, b.placa
        `);
        const bienes = bienesResult.rows;
        console.log(`   ✅ ${bienes.length} bienes asignados disponibles`);

        if (usuarios.length === 0 || cuentadantes.length === 0) {
            throw new Error('No hay usuarios o cuentadantes disponibles. Ejecuta los scripts anteriores primero.');
        }

        // 2. Crear solicitudes de prueba con estados ALEATORIOS (historial realista)
        console.log('\n2️⃣ Creando solicitudes de prueba con historial variado...');
        
        // Estados posibles con sus probabilidades (simulando un historial real)
        const estadosPosibles = [
            { estado: 'pendiente', peso: 15 },        // 15% - Solicitudes recientes
            { estado: 'firmada_cuentadante', peso: 12 }, // 12% - En proceso
            { estado: 'aprobada', peso: 10 },         // 10% - Esperando vigilante
            { estado: 'en_prestamo', peso: 20 },      // 20% - Muchas en uso
            { estado: 'devuelto', peso: 35 },         // 35% - Mayoría completadas
            { estado: 'rechazada', peso: 5 },         // 5% - Pocas rechazadas
            { estado: 'cancelada', peso: 3 }          // 3% - Muy pocas canceladas
        ];

        const motivosSolicitud = [
            'Necesario para clases de programación',
            'Requerido para taller de redes',
            'Solicitud para laboratorio de bases de datos',
            'Equipo necesario para presentaciones',
            'Material requerido para curso de ofimática',
            'Herramientas para taller de mantenimiento',
            'Equipos para aula de capacitación',
            'Recursos para proyecto de grado',
            'Material didáctico para formación',
            'Equipos para evento institucional',
            'Solicitud para capacitación docente',
            'Material para práticas de laboratorio',
            'Equipos para simulacro de examen',
            'Recursos para feria de ciencias',
            'Herramientas para proyecto integrador'
        ];

        // Función para seleccionar estado aleatorio basado en pesos
        function seleccionarEstadoAleatorio() {
            const totalPeso = estadosPosibles.reduce((sum, item) => sum + item.peso, 0);
            let random = Math.random() * totalPeso;
            
            for (const item of estadosPosibles) {
                random -= item.peso;
                if (random <= 0) {
                    return item.estado;
                }
            }
            return 'pendiente'; // fallback
        }

        // Crear 30 solicitudes con estados aleatorios
        const totalSolicitudes = 30;
        let contadorSolicitudes = 0;
        let solicitudesCreadas = [];

        console.log(`   📋 Creando ${totalSolicitudes} solicitudes con estados aleatorios...`);

        for (let i = 0; i < totalSolicitudes; i++) {
            // Usar siempre el mismo usuario (el único con rol usuario)
            if (usuarios.length === 0) {
                console.log(`   ⚠️  No hay usuarios con solo rol 'usuario' disponibles`);
                continue;
            }
            const usuarioSolicitante = usuarios[0]; // Siempre el mismo usuario
            
            // Seleccionar una sede aleatoria para esta solicitud
            const sedesDisponibles = [...new Set(bienes.map(b => b.sede_id))];
            const sedeSeleccionada = sedesDisponibles[Math.floor(Math.random() * sedesDisponibles.length)];
            
            // Filtrar bienes solo de la sede seleccionada
            const bienesDisponibles = bienes.filter(b => b.sede_id === sedeSeleccionada);
            if (bienesDisponibles.length === 0) continue;
            
            // Seleccionar 1-3 bienes aleatorios de la misma sede
            const cantidadBienes = Math.floor(Math.random() * 3) + 1;
            const bienesSeleccionados = [];
            
            for (let j = 0; j < cantidadBienes && j < bienesDisponibles.length; j++) {
                const bienAleatorio = bienesDisponibles[Math.floor(Math.random() * bienesDisponibles.length)];
                if (!bienesSeleccionados.find(b => b.id === bienAleatorio.id)) {
                    bienesSeleccionados.push(bienAleatorio);
                }
            }

            if (bienesSeleccionados.length === 0) continue;

            // Seleccionar estado aleatorio
            const estadoAleatorio = seleccionarEstadoAleatorio();

            // Crear fechas realistas basadas en el estado
            let fechaBase = new Date();
            if (estadoAleatorio === 'devuelto') {
                // Solicitudes devueltas son más antiguas (1-60 días)
                fechaBase.setDate(fechaBase.getDate() - Math.floor(Math.random() * 60) - 1);
            } else if (estadoAleatorio === 'en_prestamo') {
                // En préstamo son recientes (1-30 días)
                fechaBase.setDate(fechaBase.getDate() - Math.floor(Math.random() * 30) - 1);
            } else if (estadoAleatorio === 'pendiente') {
                // Pendientes son muy recientes (1-7 días)
                fechaBase.setDate(fechaBase.getDate() - Math.floor(Math.random() * 7));
            } else {
                // Otros estados (1-45 días)
                fechaBase.setDate(fechaBase.getDate() - Math.floor(Math.random() * 45) - 1);
            }
            
            const motivoAleatorio = motivosSolicitud[Math.floor(Math.random() * motivosSolicitud.length)];
            
            // Destinos aleatorios realistas
            const destinosAleatorios = [
                'Salón 101 - Programación',
                'Laboratorio de Redes',
                'Auditorio Principal',
                'Sala de Conferencias',
                'Aula de Capacitación 205',
                'Laboratorio de Bases de Datos',
                'Salón de Sistemas 302',
                'Centro de Cómputo',
                'Biblioteca Institucional',
                'Oficina de Coordinación',
                'Taller de Mantenimiento',
                'Sala de Juntas Directivas',
                'Laboratorio de Electrónica',
                'Aula Magna',
                'Oficina de Bienestar'
            ];
            
            const destinoAleatorio = destinosAleatorios[Math.floor(Math.random() * destinosAleatorios.length)];

            // Crear solicitud
            const solicitudResult = await pool.query(`
                INSERT INTO solicitudes (
                    doc_persona, sede_id, destino, motivo, observaciones, 
                    fecha_ini_prestamo, fecha_fin_prestamo, estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [
                usuarioSolicitante.documento,
                sedeSeleccionada, // Sede seleccionada (todos los bienes son de esta sede)
                destinoAleatorio,
                motivoAleatorio,
                `Observaciones para solicitud ${estadoAleatorio}`,
                new Date(fechaBase.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 día (solo fecha)
                new Date(fechaBase.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 días (solo fecha)
                estadoAleatorio
            ]);

            const solicitudId = solicitudResult.rows[0].id;

            // Agregar detalles de bienes (necesitamos obtener asignacion_id)
            for (const bien of bienesSeleccionados) {
                // Obtener la asignación del bien
                const asignacionResult = await pool.query(`
                    SELECT id FROM asignaciones WHERE bien_id = $1 LIMIT 1
                `, [bien.id]);
                
                if (asignacionResult.rows.length > 0) {
                    await pool.query(`
                        INSERT INTO detalle_solicitud (solicitud_id, asignacion_id)
                        VALUES ($1, $2)
                    `, [solicitudId, asignacionResult.rows[0].id]);
                }
            }

            // Crear firmas según el estado
            await crearFirmasSegunEstado(solicitudId, estadoAleatorio, sedeSeleccionada, fechaBase);
            
            // Para estado 'devuelto', agregar firma adicional de entrada del vigilante
            if (estadoAleatorio === 'devuelto') {
                const vigilante = vigilantes.find(v => v.sede_id === sedeSeleccionada);
                if (vigilante) {
                    const fechaEntrada = new Date(fechaBase);
                    fechaEntrada.setHours(fechaEntrada.getHours() + Math.floor(Math.random() * 48) + 24); // Entre 1-3 días después
                    
                    await pool.query(`
                        INSERT INTO firma_solicitud (
                            solicitud_id, doc_persona, rol_usuario, 
                            firma, observacion, fecha_firmado
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        solicitudId, vigilante.documento, 'vigilante',
                        true, 'Entrada registrada - Bienes devueltos', fechaEntrada.toISOString()
                    ]);
                }
            }

            // 🔧 ACTUALIZAR ESTADO BLOQUEADO DE BIENES SEGÚN EL ESTADO DE LA SOLICITUD
            if (estadoAleatorio === 'firmada_cuentadante' || estadoAleatorio === 'aprobada' || estadoAleatorio === 'en_prestamo') {
                // Bloquear bienes cuando el cuentadante ha firmado (y estados posteriores)
                await pool.query(`
                    UPDATE asignaciones 
                    SET bloqueado = true 
                    WHERE id IN (
                        SELECT asignacion_id 
                        FROM detalle_solicitud 
                        WHERE solicitud_id = $1
                    )
                `, [solicitudId]);
            } else if (estadoAleatorio === 'devuelto' || estadoAleatorio === 'rechazada' || estadoAleatorio === 'cancelada') {
                // Desbloquear bienes cuando se devuelven, rechazan o cancelan
                await pool.query(`
                    UPDATE asignaciones 
                    SET bloqueado = false 
                    WHERE id IN (
                        SELECT asignacion_id 
                        FROM detalle_solicitud 
                        WHERE solicitud_id = $1
                    )
                `, [solicitudId]);
            }
            // Para 'pendiente' no se hace nada (bienes siguen disponibles)

            solicitudesCreadas.push({
                id: solicitudId,
                usuario: usuarioSolicitante.nombres,
                estado: estadoAleatorio,
                bienes: bienesSeleccionados.length,
                sede: bienes.find(b => b.sede_id === sedeSeleccionada)?.sede_nombre || 'Desconocida'
            });

            contadorSolicitudes++;
            
            // Mostrar progreso cada 10 solicitudes
            if (contadorSolicitudes % 10 === 0) {
                console.log(`      ✅ ${contadorSolicitudes} solicitudes creadas...`);
            }
        }

        console.log(`   🎉 Total de solicitudes creadas: ${contadorSolicitudes}`);

        // 3. Función para crear firmas según estado
        async function crearFirmasSegunEstado(solicitudId, estado, sedeId, fechaBase) {
            const tiposFirma = ['cuentadante', 'coordinador', 'vigilante'];
            let fechaFirma = new Date(fechaBase);

            // Determinar flujo según el estado final
            let flujoFirmas = [];

            switch (estado) {
                case 'pendiente':
                    // Sin firmas
                    flujoFirmas = [];
                    break;
                    
                case 'cancelada':
                    // Sin firmas (cancelada por usuario antes de cualquier firma)
                    flujoFirmas = [];
                    break;
                    
                case 'firmada_cuentadante':
                    // Solo cuentadante aprobó
                    flujoFirmas = [
                        { rol: 'cuentadante', firma: true, obs: 'Aprobado por cuentadante - Solicitud válida' }
                    ];
                    break;
                    
                case 'aprobada':
                    // Cuentadante aprobó, coordinador aprobó
                    flujoFirmas = [
                        { rol: 'cuentadante', firma: true, obs: 'Aprobado por cuentadante' },
                        { rol: 'coordinador', firma: true, obs: 'Aprobado por coordinador - Proceder con vigilante' }
                    ];
                    break;
                    
                case 'en_prestamo':
                    // Cuentadante aprobó, coordinador aprobó, vigilante autorizó salida
                    flujoFirmas = [
                        { rol: 'cuentadante', firma: true, obs: 'Aprobado por cuentadante' },
                        { rol: 'coordinador', firma: true, obs: 'Aprobado por coordinador' },
                        { rol: 'vigilante', firma: true, obs: 'Bienes entregados - En préstamo' }
                    ];
                    break;
                    
                case 'devuelto':
                    // Flujo completo: cuentadante aprobó, coordinador aprobó, vigilante salida, vigilante entrada
                    flujoFirmas = [
                        { rol: 'cuentadante', firma: true, obs: 'Aprobado por cuentadante' },
                        { rol: 'coordinador', firma: true, obs: 'Aprobado por coordinador' },
                        { rol: 'vigilante', firma: true, obs: 'Bienes entregados - En préstamo' }
                    ];
                    break;
                    
                case 'rechazada':
                    // Determinar quién rechazó (solo cuentadante o coordinador)
                    const quienRechazo = Math.floor(Math.random() * 2); // 0 = cuentadante, 1 = coordinador
                    
                    if (quienRechazo === 0) {
                        // Cuentadante rechazó (flujo termina aquí)
                        const motivosCuentadante = [
                            'Los bienes no están en condiciones adecuadas para préstamo',
                            'Los bienes solicitados no están bajo mi responsabilidad',
                            'Falta documentación requerida para el préstamo',
                            'Los bienes están programados para mantenimiento'
                        ];
                        const motivoAleatorio = motivosCuentadante[Math.floor(Math.random() * motivosCuentadante.length)];
                        flujoFirmas = [
                            { rol: 'cuentadante', firma: false, obs: `Rechazado por cuentadante - ${motivoAleatorio}` }
                        ];
                    } else {
                        // Coordinador rechazó (cuentadante aprobó primero)
                        const motivosCoordinador = [
                            'La solicitud no cumple con las políticas institucionales',
                            'No hay justificación suficiente para el préstamo',
                            'Los bienes solicitados exceden los límites permitidos',
                            'Falta autorización del área correspondiente'
                        ];
                        const motivoAleatorio = motivosCoordinador[Math.floor(Math.random() * motivosCoordinador.length)];
                        flujoFirmas = [
                            { rol: 'cuentadante', firma: true, obs: 'Aprobado por cuentadante' },
                            { rol: 'coordinador', firma: false, obs: `Rechazado por coordinador - ${motivoAleatorio}` }
                        ];
                    }
                    break;
            }

            // Crear las firmas según el flujo determinado
            for (let i = 0; i < flujoFirmas.length; i++) {
                const firmaInfo = flujoFirmas[i];
                fechaFirma.setHours(fechaFirma.getHours() + (i + 1) * 2); // +2 horas entre firmas

                // Obtener firmante de la sede correspondiente
                let firmante;
                if (firmaInfo.rol === 'cuentadante') {
                    firmante = cuentadantes.find(c => c.sede_id === sedeId);
                } else if (firmaInfo.rol === 'coordinador') {
                    firmante = coordinadores.find(c => c.sede_id === sedeId);
                } else if (firmaInfo.rol === 'vigilante') {
                    firmante = vigilantes.find(v => v.sede_id === sedeId);
                }

                if (firmante) {
                    await pool.query(`
                        INSERT INTO firma_solicitud (
                            solicitud_id, doc_persona, rol_usuario, 
                            firma, observacion, fecha_firmado
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        solicitudId, firmante.documento, firmaInfo.rol,
                        firmaInfo.firma, firmaInfo.obs, fechaFirma.toISOString()
                    ]);
                }
            }


        }

        // 4. Resumen final
        console.log('\n📊 RESUMEN DE SOLICITUDES CREADAS:');
        
        const resumenEstados = await pool.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM solicitudes
            GROUP BY estado
            ORDER BY estado
        `);

        resumenEstados.rows.forEach(row => {
            console.log(`   ${row.estado}: ${row.cantidad} solicitudes`);
        });

        // Mostrar distribución por sede
        console.log('\n🏢 DISTRIBUCIÓN POR SEDE:');
        const distribucionSede = await pool.query(`
            SELECT s.nombre as sede, COUNT(DISTINCT sol.id) as cantidad_solicitudes
            FROM solicitudes sol
            JOIN detalle_solicitud ds ON sol.id = ds.solicitud_id
            JOIN asignaciones a ON ds.asignacion_id = a.id
            JOIN ambientes amb ON a.ambiente_id = amb.id
            JOIN sedes s ON amb.sede_id = s.id
            GROUP BY s.nombre
            ORDER BY s.nombre
        `);

        distribucionSede.rows.forEach(row => {
            console.log(`   ${row.sede}: ${row.cantidad_solicitudes} solicitudes`);
        });

        // Mostrar firmas creadas
        const firmasCount = await pool.query('SELECT COUNT(*) as total FROM firma_solicitud');
        console.log(`\n✍️ Total de firmas creadas: ${firmasCount.rows[0].total}`);

        console.log('\n✅ SOLICITUDES DE PRUEBA CREADAS EXITOSAMENTE');
        console.log('🎯 El sistema ahora tiene solicitudes en todos los estados');
        console.log('\n📋 HISTORIAL REALISTA CREADO:');
        console.log('   📝 Estados mezclados aleatoriamente (como un historial real)');
        console.log('   📅 Fechas variadas: desde hace 60 días hasta hoy');
        console.log('   🎯 Distribución realista: más devueltas, algunas en préstamo, pocas pendientes');
        console.log('   ✅ Firmada por Cuentadante (1 firma): Esperando coordinador');
        console.log('   🎯 Aprobada (2 firmas): Esperando vigilante');
        console.log('   📦 En Préstamo (3 firmas): Bienes entregados por vigilante');
        console.log('   🏁 Devuelto (4 firmas): Bienes devueltos - Proceso completado');
        console.log('   🚫 Cancelada (0 firmas): Cancelada por usuario');
        console.log('   ❌ Rechazadas: Rechazadas en diferentes etapas');

        console.log('\n🔒 ESTADOS DE BIENES ACTUALIZADOS:');
        console.log('   🟢 Pendientes: Bienes disponibles (bloqueado = false)');
        console.log('   🔴 Firmada/Aprobada/En Préstamo: Bienes bloqueados (bloqueado = true)');
        console.log('   🟢 Devuelto/Rechazada/Cancelada: Bienes disponibles (bloqueado = false)');

        console.log('\n💡 Próximos pasos:');
        console.log('   1. Inicia sesión con el usuario regular (100021) para ver sus solicitudes');
        console.log('   2. Inicia sesión con cuentadantes para ver solicitudes pendientes de su sede');
        console.log('   3. Inicia sesión con coordinadores para ver solicitudes firmadas por cuentadante');
        console.log('   4. Inicia sesión con vigilantes para ver solicitudes aprobadas por coordinador');
        console.log('   5. Valida que las restricciones de sede funcionan correctamente');

    } catch (error) {
        console.error('❌ Error creando solicitudes:', error.message);
        console.log('\n💡 Asegúrate de que:');
        console.log('   - Ejecutaste los scripts 1, 2 y 3 primero');
        console.log('   - Hay usuarios, cuentadantes y bienes disponibles');
        console.log('   - La base de datos tiene la estructura correcta');
    } finally {
        await pool.end();
    }
}

createTestRequests();