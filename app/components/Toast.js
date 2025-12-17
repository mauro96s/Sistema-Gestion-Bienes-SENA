'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    // Normalizar type a los esperados por el diseño (success, alert, error, info)
    // El proyecto usa 'warning', el diseño 'alert'. Mapeamos warning -> alert
    const normalizedType = type === 'warning' ? 'alert' : type;

    setToasts(prev => [...prev, { id, message, type: normalizedType, duration }]);

    // Auto-remover después de la duración
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => showToast(message, 'success', duration), [showToast]);
  const error = useCallback((message, duration) => showToast(message, 'error', duration), [showToast]);
  const warning = useCallback((message, duration) => showToast(message, 'alert', duration), [showToast]);
  const info = useCallback((message, duration) => showToast(message, 'info', duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * Toast Component - Diseño Específico
 * Basado en el HTML/CSS proporcionado
 */
function Toast({ toast, onClose }) {
  const { message, type } = toast;

  // Estilos base (popup)
  // .popup { margin: 10px; box-shadow: ...; width: 300px; display: flex; align-items: center; border-radius: 4px; padding: 5px 0; }
  const baseClasses = "relative w-[300px] flex items-center shadow-[4px_4px_10px_-10px_rgba(0,0,0,1)] rounded p-2 my-2 pointer-events-auto transition-all duration-300 animate-slide-in-right font-light";

  // Variantes
  const variants = {
    success: {
      container: "bg-[#edfbd8] border border-[#84d65a]",
      iconColor: "fill-[#84d65a]",
      textColor: "text-[#2b641e]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="m12 1c-6.075 0-11 4.925-11 11s4.925 11 11 11 11-4.925 11-11-4.925-11-11-11zm4.768 9.14c.0878-.1004.1546-.21726.1966-.34383.0419-.12657.0581-.26026.0477-.39319-.0105-.13293-.0475-.26242-.1087-.38085-.0613-.11844-.1456-.22342-.2481-.30879-.1024-.08536-.2209-.14938-.3484-.18828s-.2616-.0519-.3942-.03823c-.1327.01366-.2612.05372-.3782.1178-.1169.06409-.2198.15091-.3027.25537l-4.3 5.159-2.225-2.226c-.1886-.1822-.4412-.283-.7034-.2807s-.51301.1075-.69842.2929-.29058.4362-.29285.6984c-.00228.2622.09851.5148.28067.7034l3 3c.0983.0982.2159.1748.3454.2251.1295.0502.2681.0729.4069.0665.1387-.0063.2747-.0414.3991-.1032.1244-.0617.2347-.1487.3236-.2554z"
            clipRule="evenodd"
            className="fill-[#84d65a]"
          ></path>
        </svg>
      )
    },
    alert: { // Warning
      container: "bg-[#fefce8] border border-[#facc15]",
      iconColor: "fill-[#facc15]",
      textColor: "text-[#ca8a04]",
      icon: (
        <svg viewBox="0 0 20 20" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
            className="fill-[#facc15]"
          ></path>
        </svg>
      )
    },
    error: {
      container: "bg-[#fef2f2] border border-[#f87171]",
      iconColor: "fill-[#f87171]",
      textColor: "text-[#991b1b]",
      icon: (
        <svg viewBox="0 0 20 20" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
            className="fill-[#f87171]"
          ></path>
        </svg>
      )
    },
    info: {
      container: "bg-[#eff6ff] border border-[#1d4ed8]",
      iconColor: "fill-[#1d4ed8]",
      textColor: "text-[#1d4ed8]",
      icon: (
        <svg viewBox="0 0 20 20" className="w-5 h-5">
          <path
            clipRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            fillRule="evenodd"
            className="fill-[#1d4ed8]"
          ></path>
        </svg>
      )
    }
  };

  const style = variants[type] || variants.info;

  return (
    <div className={`${baseClasses} ${style.container} justify-between`}>
      <div className="flex items-center">
        {/* Icon */}
        <div className="mx-2 flex items-center justify-center">
          {style.icon}
        </div>

        {/* Message */}
        <div className={`${style.textColor} text-sm flex-1`}>
          {message}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="ml-auto mr-2 p-1 hover:bg-black/5 rounded cursor-pointer"
        aria-label="Cerrar"
      >
        <svg viewBox="0 0 20 20" className="w-4 h-4">
          <path
            d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z"
            className="fill-gray-500" // Close icon is grey in snippet
          ></path>
        </svg>
      </button>
    </div>
  );
}
