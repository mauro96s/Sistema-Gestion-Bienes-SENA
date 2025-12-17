import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Número de rondas de salt para bcrypt (10 es un buen balance entre seguridad y velocidad)
// Más alto = más seguro pero más lento
const SALT_ROUNDS = 10;

// =============================================================================
// BCRYPT: Para hashear y verificar contraseñas
// =============================================================================

/**
 * Hashea una contraseña usando bcrypt
 * 
 * ¿Qué hace bcrypt?
 * - Convierte la contraseña en un hash irreversible
 * - Agrega un "salt" (texto random) para que dos contraseñas iguales tengan hashes diferentes
 * - Es lento a propósito para dificultar ataques de fuerza bruta
 * 
 * Ejemplo:
 * hashPassword("admin123") → "$2b$10$abc123def456..."
 * hashPassword("admin123") → "$2b$10$xyz789ghi012..." (diferente hash!)
 * 
 * @param {string} plainPassword - Contraseña en texto plano
 * @returns {Promise<string>} Hash de la contraseña
 */
export async function hashPassword(plainPassword) {
    try {
        const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error('Error al hashear contraseña:', error);
        throw new Error('Error al procesar contraseña');
    }
}

/**
 * Compara una contraseña plana con un hash
 * 
 * Ejemplo:
 * const hash = "$2b$10$abc123...";
 * await comparePassword("admin123", hash) → true
 * await comparePassword("wrongpass", hash) → false
 * 
 * @param {string} plainPassword - Contraseña en texto plano
 * @param {string} hashedPassword - Hash almacenado en la BD
 * @returns {Promise<boolean>} true si coinciden, false si no
 */
export async function comparePassword(plainPassword, hashedPassword) {
    try {
        const match = await bcrypt.compare(plainPassword, hashedPassword);
        return match;
    } catch (error) {
        console.error('Error al comparar contraseña:', error);
        throw new Error('Error al verificar contraseña');
    }
}

// =============================================================================
// JWT: Para generar y verificar tokens de autenticación
// =============================================================================

/**
 * Genera un JSON Web Token (JWT) con la información del usuario
 * 
 * ¿Qué es un JWT?
 * - Un string codificado que contiene datos del usuario
 * - Se firma con una clave secreta para evitar alteraciones
 * - Tiene fecha de expiración
 * - El cliente lo envía en cada petición para autenticarse
 * 
 * Estructura del JWT:
 * Header.Payload.Signature
 * 
 * Payload incluye:
 * - id: ID del usuario
 * - email: Email del usuario
 * - rol: Rol del usuario (administrador, cuentadante, etc.)
 * - nombre: Nombre del usuario
 * - iat: Timestamp de creación
 * - exp: Timestamp de expiración
 * 
 * @param {Object} user - Objeto con datos del usuario (id, email, rol, nombre)
 * @returns {string} JWT token
 */
export function generateToken(user) {
    // Datos que se incluirán en el token (payload)
    const payload = {
        id: user.id,
        documento: user.documento,
        correo: user.correo || user.email,
        rol: user.rol,
        nombre: user.nombre
    };

    // Opciones del token
    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Expira en 7 días por defecto
        issuer: 'sena-sgb', // Identificador de quien emite el token
    };

    try {
        // Firmar el token con la clave secreta
        const token = jwt.sign(payload, process.env.JWT_SECRET, options);
        return token;
    } catch (error) {
        console.error('Error al generar token:', error);
        throw new Error('Error al generar token de autenticación');
    }
}

/**
 * Verifica un JWT y retorna los datos del usuario
 * 
 * Verifica:
 * - Que el token no haya sido alterado (firma válida)
 * - Que no haya expirado
 * - Que esté bien formado
 * 
 * @param {string} token - JWT token a verificar
 * @returns {Object} Datos del usuario decodificados
 * @throws {Error} Si el token es inválido o expiró
 */
export function verifyToken(token) {
    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        // Diferentes tipos de errores
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        } else {
            throw new Error('Error al verificar token');
        }
    }
}

/**
 * Decodifica un JWT sin verificar la firma (solo para debugging)
 * NUNCA uses esto para autenticación real, solo para ver qué contiene un token
 * 
 * @param {string} token - JWT token
 * @returns {Object} Datos decodificados (sin verificar)
 */
export function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('Error al decodificar token:', error);
        return null;
    }
}
