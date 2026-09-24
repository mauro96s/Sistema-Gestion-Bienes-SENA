import mysql from 'mysql2/promise';

// Pool de conexiones a MySQL
// Un pool mantiene varias conexiones abiertas y las reutiliza para mejor rendimiento
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // localhost
    port: parseInt(process.env.DB_PORT || '3306'), // 3306
    database: process.env.DB_NAME,   // sena_bienes
    user: process.env.DB_USER,       // root
    password: process.env.DB_PASSWORD, // password
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Función helper para ejecutar queries de forma más simple
 * @param {string} text - Query SQL (usa ? para parámetros)
 * @param {array} params - Valores de los parámetros
 * @returns {Promise} Resultado de la query en formato compatible con pg ({ rows: [] })
 */
export async function query(text, params) {
    const start = Date.now();

    try {
        // En mysql2, query devuelve [rows, fields]
        const [rows] = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log para debugging (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Query ejecutada:', {
                query: text.substring(0, 50) + '...',
                duration: duration + 'ms',
                rows: Array.isArray(rows) ? rows.length : 'N/A'
            });
        }

        // Devolvemos un objeto con la propiedad 'rows' para mantener compatibilidad
        let rowsArray = [];
        if (Array.isArray(rows)) {
            rowsArray = rows;
        } else if (rows && typeof rows === 'object') {
            // Si es un objeto de resultado (INSERT/UPDATE/DELETE)
            // Añadimos insertId como 'id' si existe para compatibilidad con RETURNING id
            rowsArray = [{ ...rows, id: rows.insertId }];
        }

        return { 
            rows: rowsArray,
            rowCount: Array.isArray(rows) ? rows.length : (rows ? rows.affectedRows || 0 : 0)
        };
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
 */
export async function getClient() {
    const connection = await pool.getConnection();
    
    // Envoltorio para simular el comportamiento de pg
    return {
        query: async (text, params) => {
            const [rows] = await connection.query(text, params);
            
            // Mapear insertId a id para compatibilidad con el resto del código
            let rowsArray = [];
            if (Array.isArray(rows)) {
                rowsArray = rows;
            } else if (rows && typeof rows === 'object') {
                rowsArray = [{ ...rows, id: rows.insertId }];
            }

            return { 
                rows: rowsArray,
                rowCount: Array.isArray(rows) ? rows.length : (rows ? rows.affectedRows || 0 : 0)
            };
        },
        release: () => connection.release()
    };
}

// Exportar el pool por si necesitas acceso directo
export default pool;
