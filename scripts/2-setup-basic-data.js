/**
 * SCRIPT 2: CONFIGURACIÓN DE DATOS BÁSICOS
 * 
 * Funciones:
 * - Crea roles del sistema
 * - Crea usuarios básicos con contraseñas hasheadas
 * - Asigna roles a usuarios
 * - Crea sedes y ambientes
 * - Crea marcas básicas
 * 
 * Requisito: Ejecutar después del script 1-reset-database.js
 * 
 * Uso: node scripts/2-setup-basic-data.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
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

const SALT_ROUNDS = 10;

async function setupBasicData() {
    try {
        console.log('🏗️ CONFIGURANDO DATOS BÁSICOS DEL SISTEMA...\n');

        // 1. CREAR ROLES
        console.log('1️⃣ Creando roles del sistema...');
        const roles = [
            'administrador',
            'almacenista', 
            'cuentadante',
            'usuario',
            'vigilante',
            'coordinador'
        ];

        for (const rolNombre of roles) {
            await pool.query('INSERT INTO rol (nombre) VALUES ($1)', [rolNombre]);
            console.log(`   ✅ Rol: ${rolNombre}`);
        }

        // 2. CREAR SEDES
        console.log('\n2️⃣ Creando sedes...');
        const sedes = [
            'Sede Pescadero',
            'Sede Calzado', 
            'Sede Comuneros'
        ];

        const sedeIds = {};
        for (const sedeNombre of sedes) {
            const result = await pool.query('INSERT INTO sedes (nombre) VALUES ($1) RETURNING id', [sedeNombre]);
            sedeIds[sedeNombre] = result.rows[0].id;
            console.log(`   ✅ Sede: ${sedeNombre} (ID: ${sedeIds[sedeNombre]})`);
        }

        // 3. CREAR AMBIENTES
        console.log('\n3️⃣ Creando ambientes...');
        const ambientes = [
            { nombre: 'Aula 101', sede: 'Sede Pescadero' },
            { nombre: 'Aula 102', sede: 'Sede Pescadero' },
            { nombre: 'Laboratorio 201', sede: 'Sede Pescadero' },
            { nombre: 'Taller 301', sede: 'Sede Calzado' },
            { nombre: 'Aula 302', sede: 'Sede Calzado' },
            { nombre: 'Laboratorio 303', sede: 'Sede Calzado' },
            { nombre: 'Auditorio', sede: 'Sede Comuneros' },
            { nombre: 'Sala de Juntas', sede: 'Sede Comuneros' },
            { nombre: 'Biblioteca', sede: 'Sede Comuneros' }
        ];

        for (const ambiente of ambientes) {
            await pool.query('INSERT INTO ambientes (nombre, sede_id) VALUES ($1, $2)', 
                [ambiente.nombre, sedeIds[ambiente.sede]]);
            console.log(`   ✅ ${ambiente.nombre} (${ambiente.sede})`);
        }

        // 4. CREAR MARCAS
        console.log('\n4️⃣ Creando marcas...');
        const marcas = [
            'Genérico',
            'HP',
            'Dell', 
            'Lenovo',
            'Samsung',
            'Canon',
            'Epson',
            'Microsoft'
        ];

        for (const marca of marcas) {
            await pool.query('INSERT INTO marcas (nombre, activo) VALUES ($1, true)', [marca]);
            console.log(`   ✅ Marca: ${marca}`);
        }

        // 5. CREAR USUARIOS
        console.log('\n5️⃣ Creando usuarios del sistema...');
        const usuarios = [
            // ADMINISTRADOR (100001)
            {
                documento: '100001',
                nombres: 'Administrador',
                apellidos: 'Sistema',
                correo: 'admin@sena.edu.co',
                direccion: 'SENA Sede Principal',
                telefono: '3001234567',
                tipo_doc: 'CC',
                password: '100001',
                roles: ['administrador'],
                sede: 'Sede Pescadero'
            },

            // CUENTADANTES (4 por sede = 12)
            // Sede Pescadero
            {
                documento: '100002',
                nombres: 'Juan Carlos',
                apellidos: 'Pérez Cuentadante',
                correo: 'cuentadante1.pescadero@sena.edu.co',
                direccion: 'Calle 10 #15-20',
                telefono: '3001234568',
                tipo_doc: 'CC',
                password: '100002',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Pescadero'
            },
            {
                documento: '100003',
                nombres: 'Sandra Patricia',
                apellidos: 'Morales Cuentadante',
                correo: 'cuentadante2.pescadero@sena.edu.co',
                direccion: 'Diagonal 8 #12-25',
                telefono: '3001234569',
                tipo_doc: 'CC',
                password: '100003',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Pescadero'
            },
            {
                documento: '100004',
                nombres: 'María Elena',
                apellidos: 'García Cuentadante',
                correo: 'cuentadante3.pescadero@sena.edu.co',
                direccion: 'Carrera 15 #20-30',
                telefono: '3001234570',
                tipo_doc: 'CC',
                password: '100004',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Pescadero'
            },
            {
                documento: '100005',
                nombres: 'Carlos Alberto',
                apellidos: 'Ramírez Cuentadante',
                correo: 'cuentadante4.pescadero@sena.edu.co',
                direccion: 'Avenida 12 #8-15',
                telefono: '3001234571',
                tipo_doc: 'CC',
                password: '100005',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Pescadero'
            },

            // Sede Calzado
            {
                documento: '100006',
                nombres: 'Ana Sofía',
                apellidos: 'Martínez Cuentadante',
                correo: 'cuentadante1.calzado@sena.edu.co',
                direccion: 'Calle 25 #18-30',
                telefono: '3001234572',
                tipo_doc: 'CC',
                password: '100006',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Calzado'
            },
            {
                documento: '100007',
                nombres: 'Luis Fernando',
                apellidos: 'López Cuentadante',
                correo: 'cuentadante2.calzado@sena.edu.co',
                direccion: 'Avenida 20 #30-40',
                telefono: '3001234573',
                tipo_doc: 'CC',
                password: '100007',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Calzado'
            },
            {
                documento: '100008',
                nombres: 'Diana Carolina',
                apellidos: 'Rodríguez Cuentadante',
                correo: 'cuentadante3.calzado@sena.edu.co',
                direccion: 'Transversal 12 #5-8',
                telefono: '3001234574',
                tipo_doc: 'CC',
                password: '100008',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Calzado'
            },
            {
                documento: '100009',
                nombres: 'Roberto',
                apellidos: 'Jiménez Cuentadante',
                correo: 'cuentadante4.calzado@sena.edu.co',
                direccion: 'Calle 30 #22-15',
                telefono: '3001234575',
                tipo_doc: 'CC',
                password: '100009',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Calzado'
            },

            // Sede Comuneros
            {
                documento: '100010',
                nombres: 'Patricia Isabel',
                apellidos: 'Vargas Cuentadante',
                correo: 'cuentadante1.comuneros@sena.edu.co',
                direccion: 'Carrera 40 #25-35',
                telefono: '3001234576',
                tipo_doc: 'CC',
                password: '100010',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Comuneros'
            },
            {
                documento: '100011',
                nombres: 'Andrés Felipe',
                apellidos: 'González Cuentadante',
                correo: 'cuentadante2.comuneros@sena.edu.co',
                direccion: 'Diagonal 50 #40-60',
                telefono: '3001234577',
                tipo_doc: 'CC',
                password: '100011',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Comuneros'
            },
            {
                documento: '100012',
                nombres: 'Claudia Marcela',
                apellidos: 'Herrera Cuentadante',
                correo: 'cuentadante3.comuneros@sena.edu.co',
                direccion: 'Carrera 5 #8-12',
                telefono: '3001234578',
                tipo_doc: 'CC',
                password: '100012',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Comuneros'
            },
            {
                documento: '100013',
                nombres: 'Jorge Enrique',
                apellidos: 'Moreno Cuentadante',
                correo: 'cuentadante4.comuneros@sena.edu.co',
                direccion: 'Calle 60 #70-80',
                telefono: '3001234579',
                tipo_doc: 'CC',
                password: '100013',
                roles: ['cuentadante', 'usuario'],
                sede: 'Sede Comuneros'
            },

            // COORDINADORES (1 por sede = 3)
            {
                documento: '100014',
                nombres: 'Liliana María',
                apellidos: 'Sánchez Coordinadora',
                correo: 'coordinador.pescadero@sena.edu.co',
                direccion: 'Calle 25 #18-30',
                telefono: '3001234580',
                tipo_doc: 'CC',
                password: '100014',
                roles: ['coordinador', 'usuario'],
                sede: 'Sede Pescadero'
            },
            {
                documento: '100015',
                nombres: 'Fernando José',
                apellidos: 'Castro Coordinador',
                correo: 'coordinador.calzado@sena.edu.co',
                direccion: 'Avenida 20 #30-40',
                telefono: '3001234581',
                tipo_doc: 'CC',
                password: '100015',
                roles: ['coordinador', 'usuario'],
                sede: 'Sede Calzado'
            },
            {
                documento: '100016',
                nombres: 'Mónica Andrea',
                apellidos: 'Ruiz Coordinadora',
                correo: 'coordinador.comuneros@sena.edu.co',
                direccion: 'Transversal 12 #5-8',
                telefono: '3001234582',
                tipo_doc: 'CC',
                password: '100016',
                roles: ['coordinador', 'usuario'],
                sede: 'Sede Comuneros'
            },

            // VIGILANTES (1 por sede = 3)
            {
                documento: '100017',
                nombres: 'Jairo Alberto',
                apellidos: 'Mendoza Vigilante',
                correo: 'vigilante.pescadero@sena.edu.co',
                direccion: 'Calle 30 #22-15',
                telefono: '3001234583',
                tipo_doc: 'CC',
                password: '100017',
                roles: ['vigilante', 'usuario'],
                sede: 'Sede Pescadero'
            },
            {
                documento: '100018',
                nombres: 'Esperanza',
                apellidos: 'Torres Vigilante',
                correo: 'vigilante.calzado@sena.edu.co',
                direccion: 'Carrera 40 #25-35',
                telefono: '3001234584',
                tipo_doc: 'CC',
                password: '100018',
                roles: ['vigilante', 'usuario'],
                sede: 'Sede Calzado'
            },
            {
                documento: '100019',
                nombres: 'Héctor Fabián',
                apellidos: 'Ospina Vigilante',
                correo: 'vigilante.comuneros@sena.edu.co',
                direccion: 'Diagonal 50 #40-60',
                telefono: '3001234585',
                tipo_doc: 'CC',
                password: '100019',
                roles: ['vigilante', 'usuario'],
                sede: 'Sede Comuneros'
            },

            // ALMACENISTA (1)
            {
                documento: '100020',
                nombres: 'Beatriz Elena',
                apellidos: 'Quintero Almacenista',
                correo: 'almacenista@sena.edu.co',
                direccion: 'Carrera 5 #8-12',
                telefono: '3001234586',
                tipo_doc: 'CC',
                password: '100020',
                roles: ['almacenista', 'usuario'],
                sede: 'Sede Calzado'
            },

            // USUARIO REGULAR (1)
            {
                documento: '100021',
                nombres: 'Usuario',
                apellidos: 'Regular Prueba',
                correo: 'usuario@sena.edu.co',
                direccion: 'Calle 60 #70-80',
                telefono: '3001234587',
                tipo_doc: 'CC',
                password: '100021',
                roles: ['usuario'],
                sede: 'Sede Comuneros'
            }
        ];

        // Obtener IDs de roles
        const rolesResult = await pool.query('SELECT id, nombre FROM rol');
        const rolesMap = {};
        rolesResult.rows.forEach(rol => {
            rolesMap[rol.nombre] = rol.id;
        });

        for (const usuario of usuarios) {
            // Hashear contraseña
            const hashedPassword = await bcrypt.hash(usuario.password, SALT_ROUNDS);

            // Insertar persona
            await pool.query(`
                INSERT INTO persona (documento, nombres, apellidos, correo, direccion, telefono, tipo_doc, contraseña) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [usuario.documento, usuario.nombres, usuario.apellidos, usuario.correo, 
                usuario.direccion, usuario.telefono, usuario.tipo_doc, hashedPassword]);

            // Asignar roles
            for (const rolNombre of usuario.roles) {
                await pool.query(`
                    INSERT INTO rol_persona (rol_id, doc_persona, sede_id) 
                    VALUES ($1, $2, $3)
                `, [rolesMap[rolNombre], usuario.documento, sedeIds[usuario.sede]]);
            }

            console.log(`   ✅ ${usuario.nombres} ${usuario.apellidos} (${usuario.correo})`);
            console.log(`      Roles: ${usuario.roles.join(', ')} | Sede: ${usuario.sede}`);
        }

        // 6. RESUMEN FINAL
        console.log('\n📊 RESUMEN DE DATOS CREADOS:');
        
        const resumenQueries = [
            { tabla: 'rol', descripcion: 'Roles' },
            { tabla: 'sedes', descripcion: 'Sedes' },
            { tabla: 'ambientes', descripcion: 'Ambientes' },
            { tabla: 'marcas', descripcion: 'Marcas' },
            { tabla: 'persona', descripcion: 'Usuarios' },
            { tabla: 'rol_persona', descripcion: 'Asignaciones de rol' }
        ];

        for (const item of resumenQueries) {
            const result = await pool.query(`SELECT COUNT(*) as total FROM ${item.tabla}`);
            console.log(`   ${item.descripcion}: ${result.rows[0].total}`);
        }

        console.log('\n✅ DATOS BÁSICOS CONFIGURADOS EXITOSAMENTE');
        console.log('📋 Siguiente paso: Ejecutar script 3-create-test-inventory.js');
        console.log('\n🔑 CREDENCIALES DE ACCESO (Documento / Contraseña):');
        console.log('   👑 Administrador: 100001 / 100001');
        console.log('   📋 Cuentadantes Pescadero: 100002-100005 / (mismo número)');
        console.log('   📋 Cuentadantes Calzado: 100006-100009 / (mismo número)');
        console.log('   📋 Cuentadantes Comuneros: 100010-100013 / (mismo número)');
        console.log('   🎯 Coordinador Pescadero: 100014 / 100014');
        console.log('   🎯 Coordinador Calzado: 100015 / 100015');
        console.log('   🎯 Coordinador Comuneros: 100016 / 100016');
        console.log('   🛡️  Vigilante Pescadero: 100017 / 100017');
        console.log('   🛡️  Vigilante Calzado: 100018 / 100018');
        console.log('   🛡️  Vigilante Comuneros: 100019 / 100019');
        console.log('   📦 Almacenista: 100020 / 100020');
        console.log('   👤 Usuario Regular: 100021 / 100021');

    } catch (error) {
        console.error('❌ Error configurando datos básicos:', error.message);
        console.log('\n💡 Asegúrate de que:');
        console.log('   - Ejecutaste el script 1-reset-database.js primero');
        console.log('   - La base de datos esté corriendo');
        console.log('   - Las credenciales sean correctas');
    } finally {
        await pool.end();
    }
}

setupBasicData();