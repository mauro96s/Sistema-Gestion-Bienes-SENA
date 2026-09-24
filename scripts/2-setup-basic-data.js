/**
 * SCRIPT 2: CONFIGURACIÓN DE DATOS BÁSICOS (MySQL)
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'sena_bienes',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
};

const SALT_ROUNDS = 10;

async function setupBasicData() {
    let connection;
    try {
        console.log('🏗️ CONFIGURANDO DATOS BÁSICOS DEL SISTEMA (MySQL)...\n');
        connection = await mysql.createConnection(dbConfig);

        // 1. CREAR ROLES
        console.log('1️⃣ Creando roles del sistema...');
        const roles = ['administrador', 'almacenista', 'cuentadante', 'usuario', 'vigilante', 'coordinador'];
        for (const rolNombre of roles) {
            await connection.execute('INSERT INTO rol (nombre) VALUES (?)', [rolNombre]);
            console.log(`   ✅ Rol: ${rolNombre}`);
        }

        // 2. CREAR SEDES
        console.log('\n2️⃣ Creando sedes...');
        const sedes = ['Sede Pescadero', 'Sede Calzado', 'Sede Comuneros'];
        const sedeIds = {};
        for (const sedeNombre of sedes) {
            const [result] = await connection.execute('INSERT INTO sedes (nombre) VALUES (?)', [sedeNombre]);
            sedeIds[sedeNombre] = result.insertId;
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
            await connection.execute('INSERT INTO ambientes (nombre, sede_id) VALUES (?, ?)', 
                [ambiente.nombre, sedeIds[ambiente.sede]]);
            console.log(`   ✅ ${ambiente.nombre} (${ambiente.sede})`);
        }

        // 4. CREAR MARCAS
        console.log('\n4️⃣ Creando marcas...');
        const marcas = ['Genérico', 'HP', 'Dell', 'Lenovo', 'Samsung', 'Canon', 'Epson', 'Microsoft'];
        for (const marca of marcas) {
            await connection.execute('INSERT INTO marcas (nombre, activo) VALUES (?, 1)', [marca]);
            console.log(`   ✅ Marca: ${marca}`);
        }

        // 5. CREAR USUARIOS (Restaurados los 21 usuarios)
        console.log('\n5️⃣ Creando usuarios del sistema (21 usuarios)...');
        const usuarios = [
            // ADMINISTRADOR
            { documento: '100001', nombres: 'Administrador', apellidos: 'Sistema', correo: 'admin@sena.edu.co', password: '100001', roles: ['administrador'], sede: 'Sede Pescadero', direccion: 'Calle Falsa 123', telefono: '3001234567' },
            
            // CUENTADANTES PESCADERO (4)
            { documento: '100002', nombres: 'Juan Carlos', apellidos: 'Pérez', correo: 'cuentadante1.pescadero@sena.edu.co', password: '100002', roles: ['cuentadante', 'usuario'], sede: 'Sede Pescadero', direccion: 'Calle 1 #2-3', telefono: '3001234568' },
            { documento: '100003', nombres: 'María Elena', apellidos: 'García', correo: 'cuentadante2.pescadero@sena.edu.co', password: '100003', roles: ['cuentadante', 'usuario'], sede: 'Sede Pescadero', direccion: 'Calle 4 #5-6', telefono: '3001234569' },
            { documento: '100004', nombres: 'Ricardo Antonio', apellidos: 'Rodríguez', correo: 'cuentadante3.pescadero@sena.edu.co', password: '100004', roles: ['cuentadante', 'usuario'], sede: 'Sede Pescadero', direccion: 'Calle 7 #8-9', telefono: '3001234570' },
            { documento: '100005', nombres: 'Claudia Patricia', apellidos: 'López', correo: 'cuentadante4.pescadero@sena.edu.co', password: '100005', roles: ['cuentadante', 'usuario'], sede: 'Sede Pescadero', direccion: 'Calle 10 #11-12', telefono: '3001234571' },

            // CUENTADANTES CALZADO (4)
            { documento: '100006', nombres: 'Ana Sofía', apellidos: 'Martínez', correo: 'cuentadante1.calzado@sena.edu.co', password: '100006', roles: ['cuentadante', 'usuario'], sede: 'Sede Calzado', direccion: 'Calle 13 #14-15', telefono: '3001234572' },
            { documento: '100007', nombres: 'Diego Armando', apellidos: 'Torres', correo: 'cuentadante2.calzado@sena.edu.co', password: '100007', roles: ['cuentadante', 'usuario'], sede: 'Sede Calzado', direccion: 'Calle 16 #17-18', telefono: '3001234573' },
            { documento: '100008', nombres: 'Sandra Milena', apellidos: 'Gómez', correo: 'cuentadante3.calzado@sena.edu.co', password: '100008', roles: ['cuentadante', 'usuario'], sede: 'Sede Calzado', direccion: 'Calle 19 #20-21', telefono: '3001234574' },
            { documento: '100009', nombres: 'Oscar Iván', apellidos: 'Ramírez', correo: 'cuentadante4.calzado@sena.edu.co', password: '100009', roles: ['cuentadante', 'usuario'], sede: 'Sede Calzado', direccion: 'Calle 22 #23-24', telefono: '3001234575' },

            // CUENTADANTES COMUNEROS (4)
            { documento: '100010', nombres: 'Patricia Isabel', apellidos: 'Vargas', correo: 'cuentadante1.comuneros@sena.edu.co', password: '100010', roles: ['cuentadante', 'usuario'], sede: 'Sede Comuneros', direccion: 'Calle 25 #26-27', telefono: '3001234576' },
            { documento: '100011', nombres: 'Luis Alfonso', apellidos: 'Díaz', correo: 'cuentadante2.comuneros@sena.edu.co', password: '100011', roles: ['cuentadante', 'usuario'], sede: 'Sede Comuneros', direccion: 'Calle 28 #29-30', telefono: '3001234577' },
            { documento: '100012', nombres: 'Carmen Rosa', apellidos: 'Hernández', correo: 'cuentadante3.comuneros@sena.edu.co', password: '100012', roles: ['cuentadante', 'usuario'], sede: 'Sede Comuneros', direccion: 'Calle 31 #32-33', telefono: '3001234578' },
            { documento: '100013', nombres: 'Jorge Enrique', apellidos: 'Moreno', correo: 'cuentadante4.comuneros@sena.edu.co', password: '100013', roles: ['cuentadante', 'usuario'], sede: 'Sede Comuneros', direccion: 'Calle 34 #35-36', telefono: '3001234579' },

            // COORDINADORES (3)
            { documento: '100014', nombres: 'Liliana María', apellidos: 'Sánchez', correo: 'coordinador.pescadero@sena.edu.co', password: '100014', roles: ['coordinador', 'usuario'], sede: 'Sede Pescadero', direccion: 'Calle 37 #38-39', telefono: '3001234580' },
            { documento: '100015', nombres: 'Fernando José', apellidos: 'Castro', correo: 'coordinador.calzado@sena.edu.co', password: '100015', roles: ['coordinador', 'usuario'], sede: 'Sede Calzado', direccion: 'Calle 40 #41-42', telefono: '3001234581' },
            { documento: '100016', nombres: 'Mónica Andrea', apellidos: 'Ruiz', correo: 'coordinador.comuneros@sena.edu.co', password: '100016', roles: ['coordinador', 'usuario'], sede: 'Sede Comuneros', direccion: 'Calle 43 #44-45', telefono: '3001234582' },

            // VIGILANTES (3)
            { documento: '100017', nombres: 'Jairo Alberto', apellidos: 'Mendoza', correo: 'vigilante.pescadero@sena.edu.co', password: '100017', roles: ['vigilante', 'usuario'], sede: 'Sede Pescadero', direccion: 'Calle 46 #47-48', telefono: '3001234583' },
            { documento: '100018', nombres: 'Esperanza', apellidos: 'Torres', correo: 'vigilante.calzado@sena.edu.co', password: '100018', roles: ['vigilante', 'usuario'], sede: 'Sede Calzado', direccion: 'Calle 49 #50-51', telefono: '3001234584' },
            { documento: '100019', nombres: 'Héctor Fabián', apellidos: 'Ospina', correo: 'vigilante.comuneros@sena.edu.co', password: '100019', roles: ['vigilante', 'usuario'], sede: 'Sede Comuneros', direccion: 'Calle 52 #53-54', telefono: '3001234585' },

            // ALMACENISTA (1)
            { documento: '100020', nombres: 'Beatriz Elena', apellidos: 'Quintero', correo: 'almacenista@sena.edu.co', password: '100020', roles: ['almacenista', 'usuario'], sede: 'Sede Calzado', direccion: 'Calle 55 #56-57', telefono: '3001234586' },

            // USUARIO REGULAR (1)
            { documento: '100021', nombres: 'Usuario', apellidos: 'Regular', correo: 'usuario@sena.edu.co', password: '100021', roles: ['usuario'], sede: 'Sede Comuneros', direccion: 'Calle 58 #59-60', telefono: '3001234587' }
        ];

        const [rolesResult] = await connection.execute('SELECT id, nombre FROM rol');
        const rolesMap = {};
        rolesResult.forEach(rol => rolesMap[rol.nombre] = rol.id);

        for (const usuario of usuarios) {
            const hashedPassword = await bcrypt.hash(usuario.password, SALT_ROUNDS);
            await connection.execute(`
                INSERT INTO persona (documento, nombres, apellidos, correo, direccion, telefono, tipo_doc, contraseña) 
                VALUES (?, ?, ?, ?, ?, ?, 'CC', ?)
            `, [usuario.documento, usuario.nombres, usuario.apellidos, usuario.correo, usuario.direccion, usuario.telefono, hashedPassword]);

            for (const rolNombre of usuario.roles) {
                await connection.execute(`
                    INSERT INTO rol_persona (rol_id, doc_persona, sede_id) 
                    VALUES (?, ?, ?)
                `, [rolesMap[rolNombre], usuario.documento, sedeIds[usuario.sede]]);
            }
            console.log(`   ✅ ${usuario.nombres} ${usuario.apellidos} (${usuario.correo})`);
        }

        console.log('\n✅ DATOS BÁSICOS CONFIGURADOS EXITOSAMENTE');
    } catch (error) {
        console.error('❌ Error configurando datos básicos:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

setupBasicData();