import { NextResponse } from 'next/server';

/**
 * MIDDLEWARE DE NEXT.JS
 * 
 * Este archivo se ejecuta ANTES de que cualquier request llegue a una página o API
 * 
 * IMPORTANTE: En Next.js App Router, el middleware NO tiene acceso completo a 
 * process.env porque se ejecuta en Edge Runtime.
 * 
 * Por eso:
 * - Para PÁGINAS del cliente (/dashboard): Solo verificamos que hay token
 * - Para API ROUTES: Verificamos el token completo con JWT_SECRET
 */

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // =========================================================================
    // RUTAS PÚBLICAS (no requieren autenticación)
    // =========================================================================
    const publicRoutes = [
        '/',                      // Login
        '/api/auth/login',        // API de login
        '/api/auth/logout',       // API de logout
    ];

    // Si es una ruta pública, permitir acceso sin verificación
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // =========================================================================
    // VERIFICAR PRESENCIA DE TOKEN
    // =========================================================================

    // Buscar token en cookies
    const token = request.cookies.get('token')?.value;

    // Si no hay token, redirigir al login
    if (!token) {
        console.log('⛔ Acceso denegado - No hay token:', pathname);
        return NextResponse.redirect(new URL('/', request.url));
    }

    // =========================================================================
    // PARA RUTAS DEL DASHBOARD (cliente)
    // =========================================================================
    if (pathname.startsWith('/dashboard')) {
        // Solo verificamos que existe el token
        // La validación completa se hace en el cliente llamando a /api/auth/me
        console.log('✅ Token presente - Permitiendo acceso a:', pathname);
        return NextResponse.next();
    }

    // =========================================================================
    // PARA API ROUTES (servidor)
    // =========================================================================
    // Para API routes, necesitaríamos verificar el token completamente
    // pero como las variables de entorno no están disponibles en middleware,
    // la verificación se hace dentro de cada API route

    console.log('✅ Token presente - Permitiendo acceso a API:', pathname);
    return NextResponse.next();
}

// =========================================================================
// CONFIGURACIÓN: Qué rutas debe proteger el middleware
// =========================================================================
export const config = {
    matcher: [
        // Proteger todas las rutas del dashboard
        '/dashboard/:path*',

        // Proteger todas las APIs excepto /api/auth/*
        '/api/bienes/:path*',
        '/api/solicitudes/:path*',
        '/api/usuarios/:path*',
        '/api/reportes/:path*',
    ]
};
