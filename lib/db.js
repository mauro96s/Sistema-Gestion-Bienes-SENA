import { Pool } from 'pg';

// Pool de conexiones a PostgreSQL
// Un pool mantiene varias conexiones abiertas y las reutiliza para mejor rendimiento
const pool = new Pool({
    host: process.env.DB_HOST,       // localhost
    port: process.env.DB_PORT,       // 5432
    database: process.env.DB_NAME,   // sena_bienes
    user: process.env.DB_USER,       // postgres
    password: process.env.DB_PASSWORD, // 123456
});

// Event listener para errores del pool
pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
});

/**
 * Función helper para ejecutar queries de forma más simple
 * @param {string} text - Query SQL (usa $1, $2, etc. para parámetros)
 * @param {array} params - Valores de los parámetros
 * @returns {Promise} Resultado de la query
 * 
 * Ejemplo de uso:
 * const result = await query('SELECT * FROM usuarios WHERE email = $1', ['admin@sena.edu.co']);
 */
export async function query(text, params) {
    const start = Date.now();

    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log para debugging (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Query ejecutada:', {
                query: text.substring(0, 50) + '...', // Solo primeros 50 caracteres
                duration: duration + 'ms',
                rows: res.rowCount
            });
        }

        return res;
    } catch (error) {
        console.error('❌ Error en query:', {
            query: text,
            error: error.message
        });
        throw error;
    }
}

/**
 * Función para obtener un cliente del pool (útil para transacciones)
 * 
 * Ejemplo de uso con transacción:
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT INTO ...');
 *   await client.query('UPDATE ...');
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 * } finally {
 *   client.release();
 * }
 */
export async function getClient() {
    return await pool.connect();
}

// Exportar el pool por si necesitas acceso directo
export default pool;
