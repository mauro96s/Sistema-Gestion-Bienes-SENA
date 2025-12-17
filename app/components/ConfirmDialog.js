'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  }
  return context;
};

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        message,
        title: options.title || '¿Confirmar acción?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  const prompt = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        message,
        title: options.title || 'Ingresa información',
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        type: 'prompt',
        defaultValue: options.defaultValue || '',
        placeholder: options.placeholder || '',
        onConfirm: (value) => {
          setDialog(null);
          resolve(value);
        },
        onCancel: () => {
          setDialog(null);
          resolve(null);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialog && <ConfirmDialog dialog={dialog} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ dialog }) {
  const [inputValue, setInputValue] = useState(dialog.defaultValue || '');

  const handleConfirm = () => {
    if (dialog.type === 'prompt') {
      dialog.onConfirm(inputValue);
    } else {
      dialog.onConfirm();
    }
  };

  const typeStyles = {
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
    success: 'text-green-600',
    prompt: 'text-blue-600'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-3 ${typeStyles[dialog.type]}`}>
            {dialog.title}
          </h3>
          <p className="text-gray-700 mb-4">{dialog.message}</p>
          
          {dialog.type === 'prompt' && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={dialog.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') dialog.onCancel();
              }}
            />
          )}
        </div>
        
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={dialog.onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            {dialog.cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-[#39A900] text-white rounded-lg hover:bg-[#2e8b00] transition font-medium"
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
