/**
 * SCRIPT 3: CREACIÓN DE INVENTARIO DE PRUEBA (MySQL)
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

async function createTestInventory() {
    let connection;
    try {
        console.log('📦 CREANDO INVENTARIO DE PRUEBA (MySQL)...\n');
        connection = await mysql.createConnection(dbConfig);

        // 1. Obtener datos necesarios
        const [marcasRows] = await connection.execute('SELECT id, nombre FROM marcas ORDER BY nombre');
        const marcas = {};
        marcasRows.forEach(marca => marcas[marca.nombre] = marca.id);

        const [ambientesRows] = await connection.execute(`
            SELECT a.id, a.nombre, s.nombre as sede_nombre 
            FROM ambientes a 
            JOIN sedes s ON a.sede_id = s.id 
            ORDER BY s.nombre, a.nombre
        `);

        const [cuentadantes] = await connection.execute(`
            SELECT p.documento, p.nombres, p.apellidos, s.nombre as sede_nombre
            FROM persona p
            JOIN rol_persona rp ON p.documento = rp.doc_persona
            JOIN rol r ON rp.rol_id = r.id
            JOIN sedes s ON rp.sede_id = s.id
            WHERE r.nombre = 'cuentadante'
        `);

        if (cuentadantes.length === 0) throw new Error('No hay cuentadantes disponibles.');

        // 2. Definir categorías de bienes
        const categoriasBienes = [
            { 
                prefijo: 'COM', 
                descripcionBase: 'Computador Todo en Uno', 
                modelos: ['EliteDesk 800 G6', 'OptiPlex 7480', 'ThinkCentre M90a'],
                marcas: ['HP', 'Dell', 'Lenovo'],
                cantidad: 15,
                costoMin: 2500000,
                costoMax: 4500000,
                vidaUtil: 5
            },
            { 
                prefijo: 'LAP', 
                descripcionBase: 'Computador Portátil', 
                modelos: ['ProBook 440 G8', 'Latitude 5420', 'ThinkPad E14'],
                marcas: ['HP', 'Dell', 'Lenovo'],
                cantidad: 15,
                costoMin: 3000000,
                costoMax: 5500000,
                vidaUtil: 4
            },
            { 
                prefijo: 'IMP', 
                descripcionBase: 'Impresora Láser', 
                modelos: ['LaserJet Pro', 'imageCLASS LBP', 'EcoTank M1120'],
                marcas: ['HP', 'Canon', 'Epson'],
                cantidad: 8,
                costoMin: 800000,
                costoMax: 1500000,
                vidaUtil: 3
            },
            { 
                prefijo: 'VID', 
                descripcionBase: 'Videoproyector', 
                modelos: ['PowerLite X49', 'EB-FH52', 'NP-ME403U'],
                marcas: ['Epson', 'Epson', 'Genérico'],
                cantidad: 6,
                costoMin: 1800000,
                costoMax: 3200000,
                vidaUtil: 4
            },
            { 
                prefijo: 'TAB', 
                descripcionBase: 'Tableta Digitalizadora', 
                modelos: ['Galaxy Tab S7', 'Surface Go 3', 'iPad Air'],
                marcas: ['Samsung', 'Microsoft', 'Genérico'],
                cantidad: 10,
                costoMin: 1200000,
                costoMax: 2800000,
                vidaUtil: 3
            }
        ];

        console.log('2️⃣ Generando bienes de prueba...');
        const bienesCreados = [];
        let contadorGlobal = 1;

        for (const categoria of categoriasBienes) {
            console.log(`   📂 Creando ${categoria.cantidad} ${categoria.descripcionBase}s...`);
            
            for (let i = 1; i <= categoria.cantidad; i++) {
                const marcaAleatoria = categoria.marcas[Math.floor(Math.random() * categoria.marcas.length)];
                const modeloAleatorio = categoria.modelos[Math.floor(Math.random() * categoria.modelos.length)];
                const costoAleatorio = Math.floor(Math.random() * (categoria.costoMax - categoria.costoMin + 1)) + categoria.costoMin;
                
                const fechasCompra = ['2022-03-15', '2022-06-20', '2022-09-10', '2023-01-25', '2023-04-18', '2023-07-30', '2023-10-12', '2024-02-08', '2024-05-22'];
                const fechaAleatoria = fechasCompra[Math.floor(Math.random() * fechasCompra.length)];

                const placa = `${categoria.prefijo}-${String(i).padStart(3, '0')}`;
                const descripcion = `${categoria.descripcionBase} ${marcaAleatoria} ${modeloAleatorio}`;
                const serial = `${marcaAleatoria.substring(0,2).toUpperCase()}${Date.now().toString().slice(-6)}${i}`;
                
                const [result] = await connection.execute(`
                    INSERT INTO bienes (placa, descripcion, marca_id, modelo, serial, costo, fecha_compra, vida_util) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [placa, descripcion, marcas[marcaAleatoria] || marcas['Genérico'], modeloAleatorio, serial, costoAleatorio, fechaAleatoria, categoria.vidaUtil]);

                bienesCreados.push({ id: result.insertId, placa, descripcion });
                
                if (contadorGlobal % 10 === 0) console.log(`      ✅ ${contadorGlobal} bienes creados...`);
                contadorGlobal++;
            }
        }

        // 3. Asignar cuentadantes (Distribución equitativa)
        console.log('\n3️⃣ Asignando cuentadantes a TODOS los bienes...');
        const cuentadantesPorSede = {};
        cuentadantes.forEach(c => {
            if (!cuentadantesPorSede[c.sede_nombre]) cuentadantesPorSede[c.sede_nombre] = [];
            cuentadantesPorSede[c.sede_nombre].push(c);
        });

        let contadorAsignaciones = 0;
        let indiceCuentadante = 0;

        for (const bien of bienesCreados) {
            const ambiente = ambientesRows[Math.floor(Math.random() * ambientesRows.length)];
            const cuentadantesSede = cuentadantesPorSede[ambiente.sede_nombre] || [];
            
            let cuentadante;
            if (cuentadantesSede.length > 0) {
                cuentadante = cuentadantesSede[indiceCuentadante % cuentadantesSede.length];
                indiceCuentadante++;
            } else {
                cuentadante = cuentadantes[Math.floor(Math.random() * cuentadantes.length)];
            }

            await connection.execute(`
                INSERT INTO asignaciones (bien_id, ambiente_id, doc_persona, bloqueado) 
                VALUES (?, ?, ?, 0)
            `, [bien.id, ambiente.id, cuentadante.documento]);

            await connection.execute(`
                INSERT INTO estado_bien (bien_id, estado) VALUES (?, 'buen_estado')
            `, [bien.id]);

            contadorAsignaciones++;
            if (contadorAsignaciones % 15 === 0) console.log(`      ✅ ${contadorAsignaciones} asignaciones completadas...`);
        }

        console.log(`\n✅ INVENTARIO CREADO EXITOSAMENTE (${bienesCreados.length} bienes)`);
    } catch (error) {
        console.error('❌ Error creando inventario:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

createTestInventory();