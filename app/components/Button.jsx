import React from 'react';

/**
 * Button Component - Versión Robusta con Variantes
 * 
 * Props:
 * - variant: 'primary' (Verde, por defecto) | 'danger' (Rojo)
 * 
 * Diseño:
 * - Primary: Hover verde (#39A900), Icono rota 45deg.
 * - Danger: Hover rojo (red-600), Icono rotado 180deg (dirección contraria) por defecto.
 * 
 * Disabled:
 * - Opacidad reducida
 * - Sin animación de fondo
 */
export const Button = ({
    children,
    icon,
    className = "",
    onClick,
    type = "button",
    variant = 'primary',
    ...props
}) => {

    // Configuración de colores según variante
    const colors = {
        primary: {
            fill: 'bg-[#39A900]',
            borderHover: 'hover:border-[#39A900]',
            textHover: 'group-hover:text-[#39A900]'
        },
        danger: {
            fill: 'bg-red-600',
            borderHover: 'hover:border-red-600',
            textHover: 'group-hover:text-red-600'
        }
    };

    const currentColors = colors[variant] || colors.primary;

    // Rotación del icono: 
    const iconBaseRotation = variant === 'danger' ? 'rotate-180' : 'rotate-0';
    const iconHoverRotation = variant === 'danger' ? 'group-hover:rotate-[225deg]' : 'group-hover:rotate-45';

    return (
        <button
            type={type}
            onClick={onClick}
            className={`
        group relative flex items-center justify-center gap-2 mx-auto
        px-6 py-2 overflow-hidden rounded-full border-2 
        border-gray-100 bg-white/90 backdrop-blur-md shadow-lg
        text-gray-700 font-semibold text-sm transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${currentColors.borderHover}
        ${className}
      `}
            {...props}
        >
            {/* 1. Fondo Animado (Overlay) */}
            <span className={`absolute inset-0 w-full h-full ${currentColors.fill} transform -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0 group-disabled:hidden`} />

            {/* 2. Contenido (Texto) - Encima del fondo (z-10) */}
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white flex items-center gap-2">
                {children}
            </span>

            {/* 3. Icon Wrapper - Encima del fondo */}
            <span className={`
        relative z-10
        flex items-center justify-center w-8 h-8 rounded-full 
        border border-gray-200 bg-white/50 text-gray-700
        transition-all duration-300 ease-linear
        ${currentColors.textHover} group-hover:bg-white group-hover:border-transparent
        ${iconHoverRotation}
      `}>
                {/* Renderizado del Icono con rotación base si es necesario */}
                <span className={`transform ${iconBaseRotation} transition-transform duration-300`}>
                    {icon || (
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 16 19"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                                fill="currentColor"
                            />
                        </svg>
                    )}
                </span>
            </span>
        </button>
    );
};
