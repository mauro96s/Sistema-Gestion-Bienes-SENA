/**
 * SCRIPT 3: CREACIÓN DE INVENTARIO DE PRUEBA
 * 
 * Funciones:
 * - Crea bienes de prueba con diferentes categorías
 * - Asigna cuentadantes a los bienes
 * - Crea estados iniciales de bienes
 * - Datos listos para hacer solicitudes de prueba
 * 
 * Requisito: Ejecutar después de los scripts 1 y 2
 * 
 * Uso: node scripts/3-create-test-inventory.js
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

async function createTestInventory() {
    try {
        console.log('📦 CREANDO INVENTARIO DE PRUEBA...\n');

        // 1. Obtener datos necesarios
        console.log('1️⃣ Obteniendo datos base...');
        
        // Obtener marcas
        const marcasResult = await pool.query('SELECT id, nombre FROM marcas ORDER BY nombre');
        const marcas = {};
        marcasResult.rows.forEach(marca => {
            marcas[marca.nombre] = marca.id;
        });
        console.log(`   ✅ ${marcasResult.rows.length} marcas disponibles`);

        // Obtener ambientes
        const ambientesResult = await pool.query(`
            SELECT a.id, a.nombre, s.nombre as sede_nombre 
            FROM ambientes a 
            JOIN sedes s ON a.sede_id = s.id 
            ORDER BY s.nombre, a.nombre
        `);
        const ambientes = ambientesResult.rows;
        console.log(`   ✅ ${ambientes.length} ambientes disponibles`);

        // Obtener cuentadantes
        const cuentadantesResult = await pool.query(`
            SELECT p.documento, p.nombres, p.apellidos, s.nombre as sede_nombre
            FROM persona p
            JOIN rol_persona rp ON p.documento = rp.doc_persona
            JOIN rol r ON rp.rol_id = r.id
            JOIN sedes s ON rp.sede_id = s.id
            WHERE r.nombre = 'cuentadante'
            ORDER BY p.nombres
        `);
        const cuentadantes = cuentadantesResult.rows;
        console.log(`   ✅ ${cuentadantes.length} cuentadantes disponibles`);

        if (cuentadantes.length === 0) {
            throw new Error('No hay cuentadantes disponibles. Ejecuta el script 2 primero.');
        }

        // 2. Generar bienes de prueba (100+ bienes)
        console.log('\n2️⃣ Generando bienes de prueba (100+ bienes)...');
        
        const categoriasBienes = [
            {
                categoria: 'Computadores',
                prefijo: 'PC',
                marcas: ['HP', 'Dell', 'Lenovo'],
                modelos: ['EliteDesk 800', 'OptiPlex 3080', 'ThinkCentre M75q', 'Inspiron 3880', 'IdeaCentre 3'],
                descripcionBase: 'Computador de escritorio',
                costoMin: 1200000,
                costoMax: 2500000,
                vidaUtil: 5,
                cantidad: 25
            },
            {
                categoria: 'Laptops',
                prefijo: 'LAP',
                marcas: ['HP', 'Dell', 'Lenovo'],
                modelos: ['Pavilion 15', 'Inspiron 15', 'ThinkPad E15', 'ProBook 450', 'IdeaPad 3'],
                descripcionBase: 'Laptop portátil',
                costoMin: 1800000,
                costoMax: 3500000,
                vidaUtil: 4,
                cantidad: 20
            },
            {
                categoria: 'Impresoras',
                prefijo: 'IMP',
                marcas: ['HP', 'Canon', 'Epson'],
                modelos: ['LaserJet Pro', 'PIXMA G6020', 'EcoTank L3250', 'OfficeJet Pro', 'ImageClass'],
                descripcionBase: 'Impresora multifuncional',
                costoMin: 400000,
                costoMax: 1500000,
                vidaUtil: 5,
                cantidad: 15
            },
            {
                categoria: 'Proyectores',
                prefijo: 'PROY',
                marcas: ['Epson', 'Samsung', 'Generico'],
                modelos: ['PowerLite 2247U', 'EB-X41', 'ViewSonic PA503W', 'BenQ MX550', 'Optoma HD28HDR'],
                descripcionBase: 'Proyector multimedia',
                costoMin: 1500000,
                costoMax: 4000000,
                vidaUtil: 6,
                cantidad: 10
            },
            {
                categoria: 'Televisores',
                prefijo: 'TV',
                marcas: ['Samsung', 'Generico'],
                modelos: ['UN55AU7000', 'UN43T5300', 'Smart TV 50"', 'LED 43"', 'QLED 55"'],
                descripcionBase: 'Televisor Smart TV',
                costoMin: 1200000,
                costoMax: 3000000,
                vidaUtil: 8,
                cantidad: 8
            },
            {
                categoria: 'Escritorios',
                prefijo: 'ESC',
                marcas: ['Generico'],
                modelos: ['Ejecutivo 160', 'Operativo 120', 'Gerencial 180', 'Básico 100', 'Premium 200'],
                descripcionBase: 'Escritorio de oficina',
                costoMin: 300000,
                costoMax: 800000,
                vidaUtil: 10,
                cantidad: 12
            },
            {
                categoria: 'Sillas',
                prefijo: 'SIL',
                marcas: ['Generico'],
                modelos: ['Ergonómica Pro', 'Ejecutiva Plus', 'Operativa Basic', 'Gerencial Deluxe', 'Visitante'],
                descripcionBase: 'Silla de oficina',
                costoMin: 200000,
                costoMax: 600000,
                vidaUtil: 8,
                cantidad: 15
            }
        ];

        const bienesCreados = [];
        let contadorGlobal = 1;

        for (const categoria of categoriasBienes) {
            console.log(`   📂 Creando ${categoria.cantidad} ${categoria.categoria}...`);
            
            for (let i = 1; i <= categoria.cantidad; i++) {
                const marcaAleatoria = categoria.marcas[Math.floor(Math.random() * categoria.marcas.length)];
                const modeloAleatorio = categoria.modelos[Math.floor(Math.random() * categoria.modelos.length)];
                const costoAleatorio = Math.floor(Math.random() * (categoria.costoMax - categoria.costoMin + 1)) + categoria.costoMin;
                
                // Generar fecha aleatoria entre 2022 y 2024
                const fechasCompra = ['2022-03-15', '2022-06-20', '2022-09-10', '2023-01-25', '2023-04-18', '2023-07-30', '2023-10-12', '2024-02-08', '2024-05-22'];
                const fechaAleatoria = fechasCompra[Math.floor(Math.random() * fechasCompra.length)];

                const bien = {
                    placa: `${categoria.prefijo}-${String(i).padStart(3, '0')}`,
                    descripcion: `${categoria.descripcionBase} ${marcaAleatoria} ${modeloAleatorio}`,
                    marca: marcaAleatoria,
                    modelo: modeloAleatorio,
                    serial: `${marcaAleatoria.substring(0,2).toUpperCase()}${Date.now().toString().slice(-6)}${i}`,
                    costo: costoAleatorio,
                    fecha_compra: fechaAleatoria,
                    vida_util: categoria.vidaUtil
                };

                // Obtener ID de marca
                const marcaId = marcas[bien.marca] || marcas['Generico'];

                const result = await pool.query(`
                    INSERT INTO bienes (
                        placa, descripcion, marca_id, modelo, 
                        serial, costo, fecha_compra, vida_util
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                `, [
                    bien.placa, bien.descripcion, marcaId, bien.modelo,
                    bien.serial, bien.costo, bien.fecha_compra, bien.vida_util
                ]);

                const bienId = result.rows[0].id;
                bienesCreados.push({
                    id: bienId,
                    placa: bien.placa,
                    descripcion: bien.descripcion
                });

                if (contadorGlobal % 10 === 0) {
                    console.log(`      ✅ ${contadorGlobal} bienes creados...`);
                }
                contadorGlobal++;
            }
        }

        console.log(`   🎉 Total de bienes creados: ${bienesCreados.length}`);

        // 3. Asignar cuentadantes a TODOS los bienes (distribución equitativa)
        console.log('\n3️⃣ Asignando cuentadantes a TODOS los bienes...');
        console.log(`   📋 Total de bienes: ${bienesCreados.length}`);
        console.log(`   🎯 Bienes a asignar: ${bienesCreados.length} (TODOS)`);
        console.log(`   👥 Cuentadantes disponibles: ${cuentadantes.length}`);
        
        // Agrupar cuentadantes por sede para distribución equitativa
        const cuentadantesPorSede = {};
        cuentadantes.forEach(c => {
            if (!cuentadantesPorSede[c.sede_nombre]) {
                cuentadantesPorSede[c.sede_nombre] = [];
            }
            cuentadantesPorSede[c.sede_nombre].push(c);
        });

        console.log('   📊 Distribución de cuentadantes por sede:');
        Object.keys(cuentadantesPorSede).forEach(sede => {
            console.log(`      ${sede}: ${cuentadantesPorSede[sede].length} cuentadantes`);
        });
        
        let contadorAsignaciones = 0;
        let indiceCuentadante = 0; // Para rotación equitativa
        
        for (const bien of bienesCreados) {
            // Seleccionar ambiente aleatorio
            const ambienteAleatorio = ambientes[Math.floor(Math.random() * ambientes.length)];
            
            // Obtener cuentadantes de la misma sede del ambiente
            const cuentadantesDeLaSede = cuentadantesPorSede[ambienteAleatorio.sede_nombre] || [];
            
            let cuentadanteAsignado;
            if (cuentadantesDeLaSede.length > 0) {
                // Rotar entre los cuentadantes de la misma sede
                cuentadanteAsignado = cuentadantesDeLaSede[indiceCuentadante % cuentadantesDeLaSede.length];
                indiceCuentadante++;
            } else {
                // Si no hay cuentadante de la misma sede, asignar uno aleatorio
                cuentadanteAsignado = cuentadantes[Math.floor(Math.random() * cuentadantes.length)];
            }

            await pool.query(`
                INSERT INTO asignaciones (bien_id, ambiente_id, doc_persona, bloqueado, fecha_asignacion)
                VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
            `, [bien.id, ambienteAleatorio.id, cuentadanteAsignado.documento]);

            contadorAsignaciones++;
            if (contadorAsignaciones % 15 === 0) {
                console.log(`      ✅ ${contadorAsignaciones} asignaciones completadas...`);
            }
        }
        
        console.log(`   🎉 Total de asignaciones: ${contadorAsignaciones}`);
        console.log(`   ✅ TODOS los bienes han sido asignados a cuentadantes`);

        // 4. Crear estados iniciales de bienes
        console.log('\n4️⃣ Creando estados iniciales de bienes...');
        
        let contadorEstados = 0;
        for (const bien of bienesCreados) {
            await pool.query(`
                INSERT INTO estado_bien (bien_id, estado, fecha_registro)
                VALUES ($1, 'Disponible', CURRENT_TIMESTAMP)
            `, [bien.id]);

            contadorEstados++;
            if (contadorEstados % 20 === 0) {
                console.log(`      ✅ ${contadorEstados} estados creados...`);
            }
        }
        
        console.log(`   🎉 Total de estados creados: ${contadorEstados}`);

        // 5. Resumen final
        console.log('\n📊 RESUMEN DEL INVENTARIO CREADO:');
        
        const resumenQueries = [
            { tabla: 'bienes', descripcion: 'Bienes creados' },
            { tabla: 'asignaciones', descripcion: 'Asignaciones de cuentadante' },
            { tabla: 'estado_bien', descripcion: 'Estados de bienes' }
        ];

        for (const item of resumenQueries) {
            const result = await pool.query(`SELECT COUNT(*) as total FROM ${item.tabla}`);
            console.log(`   ${item.descripcion}: ${result.rows[0].total}`);
        }

        // Mostrar distribución por sede
        console.log('\n🏢 DISTRIBUCIÓN POR SEDE:');
        const distribucionResult = await pool.query(`
            SELECT s.nombre as sede, COUNT(a.id) as cantidad_bienes
            FROM asignaciones a
            JOIN ambientes amb ON a.ambiente_id = amb.id
            JOIN sedes s ON amb.sede_id = s.id
            GROUP BY s.nombre
            ORDER BY s.nombre
        `);

        distribucionResult.rows.forEach(row => {
            console.log(`   ${row.sede}: ${row.cantidad_bienes} bienes`);
        });

        console.log('\n✅ INVENTARIO DE PRUEBA CREADO EXITOSAMENTE');
        console.log('🎯 El sistema está listo para hacer solicitudes de prueba');
        console.log('\n📋 RESUMEN FINAL:');
        console.log(`   📦 Total bienes creados: ${bienesCreados.length}`);
        console.log(`   ✅ Bienes asignados: ${bienesCreados.length} (TODOS)`);
        console.log(`   👥 Cuentadantes por sede: 4 (distribución equitativa)`);
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Inicia sesión con documento y contraseña');
        console.log('   2. Ve a "Solicitar Bienes" para crear solicitudes');
        console.log('   3. Los cuentadantes pueden aprobar/rechazar solicitudes');
        console.log('   4. Los coordinadores y vigilantes gestionan el flujo');
        console.log('   5. Prueba con diferentes cuentadantes de la misma sede');

    } catch (error) {
        console.error('❌ Error creando inventario:', error.message);
        console.log('\n💡 Asegúrate de que:');
        console.log('   - Ejecutaste los scripts 1 y 2 primero');
        console.log('   - Hay cuentadantes creados en el sistema');
        console.log('   - Hay ambientes y marcas disponibles');
    } finally {
        await pool.end();
    }
}

createTestInventory();