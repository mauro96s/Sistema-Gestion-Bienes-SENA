'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreatableSelect from 'react-select/creatable';
import { Button } from '@/app/components/Button';
import { useToast } from '@/app/components/Toast';

export default function RegistrarBien() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(false);
  const [error, setError] = useState('');

  // Estado del formulario
  const [formData, setFormData] = useState({
    placa: '',
    descripcion: '',
    marca: '',
    marca_id: null,
    serial: '',
    modelo: '',
    costo: '',
    fecha_compra: '',
    vida_util: '',
    // Novedades (estado_bien)
    estado_inicial: 'buen_estado'
  });

  // Validar autenticación
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
    } else {
      const parsedUser = JSON.parse(userData);
      // Validar rol si es necesario, aunque el middleware debería manejarlo
      setUser(parsedUser);
    }
  }, [router]);

  // Generar placa automáticamente al cargar
  useEffect(() => {
    const generarPlaca = async () => {
      try {
        const response = await fetch('/api/bienes/generar-placa');
        const data = await response.json();

        if (data.success) {
          setFormData(prev => ({
            ...prev,
            placa: data.placa
          }));
        }
      } catch (err) {
        console.error('Error al generar placa:', err);
        // Generar placa fallback en el cliente
        const timestamp = Date.now().toString().slice(-6);
        const fallbackPlaca = `SENA-${new Date().getFullYear()}-${timestamp}`;
        setFormData(prev => ({
          ...prev,
          placa: fallbackPlaca
        }));
      }
    };

    if (user) {
      generarPlaca();
    }
  }, [user]);

  // Cargar MARCAS desde la API
  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        setIsLoadingMarcas(true);
        const response = await fetch('/api/marcas');
        const data = await response.json();

        if (data.success) {
          const marcasOptions = data.marcas.map(m => ({
            value: m.id,
            label: m.nombre
          }));
          setMarcas(marcasOptions);
        }
      } catch (err) {
        console.error('Error al cargar marcas:', err);
        setError('Error de conexión al cargar marcas');
      } finally {
        setIsLoadingMarcas(false);
      }
    };

    if (user) {
      fetchMarcas();
    }
  }, [user]);

  // Manejar cambios en inputs normales
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambio en Select de Marca
  const handleMarcaChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      marca: newValue ? newValue.label : '',
      marca_id: newValue ? newValue.value : null
    }));
  };

  // Manejar creación de nueva marca
  const handleCreateMarca = async (inputValue) => {
    setIsLoadingMarcas(true);
    try {
      const response = await fetch('/api/marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: inputValue })
      });

      const data = await response.json();

      if (data.success) {
        const newOption = { value: data.marca.id, label: data.marca.nombre };
        setMarcas(prev => [...prev, newOption]);

        setFormData(prev => ({
          ...prev,
          marca: newOption.label,
          marca_id: newOption.value
        }));
      } else {
        toast.error('Error al crear la marca: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      console.error('Error creando marca:', err);
      toast.error('Error de conexión al crear la marca');
    } finally {
      setIsLoadingMarcas(false);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const requiredFields = ['placa', 'descripcion', 'marca_id', 'costo'];

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.warning(`Por favor completa el campo obligatorio: ${field.replace('_id', '').toUpperCase()}`);
        return false;
      }
    }

    if (parseFloat(formData.costo) <= 0) {
      toast.warning('El costo debe ser mayor a 0');
      return false;
    }

    if (formData.fecha_compra && new Date(formData.fecha_compra) > new Date()) {
      toast.warning('La fecha de compra no puede ser futura');
      return false;
    }

    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bienes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/almacenista/inventario');
        }, 2000);
      } else {
        setError(data.error || 'Error al registrar el bien');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al registrar bien:', err);
      setError('Error de conexión al registrar el bien');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Registrar Nuevo Bien</h2>
        <p className="text-gray-600">Complete el formulario para registrar un nuevo activo en el sistema</p>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-3">
          <div>
            <p className="font-semibold">¡Bien registrado exitosamente!</p>
            <p className="text-sm">Redirigiendo al inventario...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Datos del Bien</h2>

        {/* Sección: Identificación */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b-2 border-[#39A900]">
            Identificación y Descripción
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placa / Código <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="placa"
                  value={formData.placa}
                  readOnly
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Placa generada automáticamente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca <span className="text-red-500">*</span>
              </label>
              <CreatableSelect
                isClearable
                isDisabled={isLoadingMarcas}
                isLoading={isLoadingMarcas}
                onChange={handleMarcaChange}
                onCreateOption={handleCreateMarca}
                options={marcas}
                value={formData.marca_id ? { label: formData.marca, value: formData.marca_id } : null}
                placeholder="Seleccionar o escribir nueva..."
                formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej: Latitude 5420"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial
              </label>
              <input
                type="text"
                name="serial"
                value={formData.serial}
                onChange={handleChange}
                placeholder="Ej: SN123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Detallada <span className="text-red-500">*</span>
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Describe las características principales del bien..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sección: Información Financiera y Vida Útil */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b-2 border-[#39A900]">
            Información Financiera y Técnica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo (COP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="costo"
                value={formData.costo}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Ej: 2500000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Compra
              </label>
              <input
                type="date"
                name="fecha_compra"
                value={formData.fecha_compra}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vida Útil (Años)
              </label>
              <input
                type="number"
                name="vida_util"
                value={formData.vida_util}
                onChange={handleChange}
                min="0"
                placeholder="Ej: 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sección: Novedades (Estado Inicial) */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b-2 border-[#39A900]">
            Novedades
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Inicial <span className="text-red-500">*</span>
              </label>
              <select
                name="estado_inicial"
                value={formData.estado_inicial}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
              >
                <option value="buen_estado">Buen Estado</option>
                <option value="en_mantenimiento">En Mantenimiento</option>
                <option value="dañado">Dañado</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Estado en el que se encuentra el bien al momento del registro
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/almacenista/inventario')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Registrando...
              </span>
            ) : (
              'Registrar Bien'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
