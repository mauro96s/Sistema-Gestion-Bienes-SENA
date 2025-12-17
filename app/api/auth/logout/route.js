import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * 
 * Endpoint para cerrar sesión
 * 
 * Simplemente elimina la cookie del token para que el usuario ya no esté autenticado
 * 
 * Respuesta:
 * {
 *   "success": true,
 *   "message": "Sesión cerrada correctamente"
 * }
 */
export async function POST(request) {
    try {
        const response = NextResponse.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });

        // Eliminar cookie del token
        response.cookies.delete('token');

        console.log('✅ Logout exitoso');

        return response;

    } catch (error) {
        console.error('❌ Error en logout:', error);
        return NextResponse.json(
            { error: 'Error al cerrar sesión' },
            { status: 500 }
        );
    }
}
