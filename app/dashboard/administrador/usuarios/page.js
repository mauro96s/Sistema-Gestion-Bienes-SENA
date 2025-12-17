'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/Button';
import { useToast } from '@/app/components/Toast';
import Pagination from '@/app/components/Pagination';

export default function GestionUsuarios() {
  const router = useRouter();
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
  const [rolPrincipal, setRolPrincipal] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [rolUsuarioId, setRolUsuarioId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroSede, setFiltroSede] = useState('');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar usuarios y roles al montar
  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar usuarios cuando cambian los filtros
  useEffect(() => {
    let filtered = usuarios;

    // Filtro por texto (nombre, email, documento)
    if (searchTerm) {
      filtered = filtered.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por rol
    if (filtroRol) {
      filtered = filtered.filter(usuario =>
        usuario.roles.some(rol => rol.nombre === filtroRol)
      );
    }

    // Filtro por sede
    if (filtroSede) {
      filtered = filtered.filter(usuario =>
        usuario.roles.some(rol => rol.sede_id === parseInt(filtroSede))
      );
    }

    setUsuariosFiltrados(filtered);
    setCurrentPage(1); // Reset página cuando cambian los filtros
  }, [searchTerm, filtroRol, filtroSede, usuarios]);

  // Paginación
  const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const usuariosPaginados = usuariosFiltrados.slice(startIndex, endIndex);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar usuarios
      const resUsuarios = await fetch('/api/administrador/usuarios');
      const dataUsuarios = await resUsuarios.json();

      // Cargar roles
      const resRoles = await fetch('/api/administrador/roles');
      const dataRoles = await resRoles.json();

      // Cargar sedes
      const resSedes = await fetch('/api/sedes');
      const dataSedes = await resSedes.json();

      if (dataUsuarios.success && dataRoles.success && dataSedes.success) {
        setUsuarios(dataUsuarios.usuarios);
        setUsuariosFiltrados(dataUsuarios.usuarios);
        setRoles(dataRoles.roles);
        setSedes(dataSedes.sedes);

        // Encontrar el ID del rol "usuario"
        const rolUsuario = dataRoles.roles.find(r => r.nombre === 'usuario');
        if (rolUsuario) {
          setRolUsuarioId(rolUsuario.id);
        }
      } else {
        toast.error('Error al cargar datos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    // Pre-seleccionar los roles actuales del usuario
    let idsRoles = usuario.roles.map(r => r.id);

    // Asegurar que el rol "usuario" siempre esté seleccionado
    if (rolUsuarioId && !idsRoles.includes(rolUsuarioId)) {
      idsRoles.push(rolUsuarioId);
    }

    setRolesSeleccionados(idsRoles);
    setRolPrincipal(usuario.rol_principal_id);
    // Pre-seleccionar la sede actual
    if (usuario.roles.length > 0 && usuario.roles[0].sede_id) {
      setSedeSeleccionada(usuario.roles[0].sede_id);
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setUsuarioSeleccionado(null);
    setRolesSeleccionados([]);
    setRolPrincipal(null);
    setSedeSeleccionada(null);
  };

  const toggleRol = (rolId) => {
    // No permitir quitar el rol "usuario"
    if (rolId === rolUsuarioId && rolesSeleccionados.includes(rolId)) {
      toast.warning('El rol "usuario" no se puede quitar. Todos los usuarios deben tener este rol.');
      return;
    }

    if (rolesSeleccionados.includes(rolId)) {
      // Remover rol
      const nuevosRoles = rolesSeleccionados.filter(id => id !== rolId);
      setRolesSeleccionados(nuevosRoles);

      // Si era el rol principal, limpiar
      if (rolPrincipal === rolId) {
        setRolPrincipal(nuevosRoles.length > 0 ? nuevosRoles[0] : null);
      }
    } else {
      // Agregar rol
      setRolesSeleccionados([...rolesSeleccionados, rolId]);

      // Si es el primer rol, hacerlo principal
      if (rolesSeleccionados.length === 0) {
        setRolPrincipal(rolId);
      }
    }
  };

  const guardarCambios = async () => {
    if (!usuarioSeleccionado) return;

    if (rolesSeleccionados.length === 0) {
      toast.warning('Debe asignar al menos un rol');
      return;
    }

    if (!rolPrincipal) {
      toast.warning('Debe seleccionar un rol principal');
      return;
    }

    if (!sedeSeleccionada) {
      toast.warning('Debe seleccionar una sede');
      return;
    }

    try {
      // 1. Actualizar roles
      const responseRoles = await fetch(`/api/administrador/usuarios/${usuarioSeleccionado.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rolesIds: rolesSeleccionados,
          rolPrincipalId: rolPrincipal
        })
      });

      const dataRoles = await responseRoles.json();

      if (!dataRoles.success) {
        toast.error(dataRoles.error || 'Error al actualizar roles');
        return;
      }

      // 2. Actualizar sede
      const responseSede = await fetch(`/api/administrador/usuarios/${usuarioSeleccionado.id}/sede`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sedeId: sedeSeleccionada
        })
      });

      const dataSede = await responseSede.json();

      if (dataSede.success) {
        toast.success('Roles y sede actualizados correctamente');
        cerrarModal();
        cargarDatos(); // Recargar la lista
      } else {
        toast.error(dataSede.error || 'Error al actualizar sede');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar cambios');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <p className="text-gray-600">Administrar roles y sedes de usuarios del sistema</p>
      </div>

      {/* Filtros de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros de búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar usuario</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, email o documento..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por rol</label>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
            >
              <option value="">Todos los roles</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.nombre}>{rol.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por sede</label>
            <select
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
            >
              <option value="">Todas las sedes</option>
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Información de filtros y botón limpiar */}
        {(searchTerm || filtroRol || filtroSede) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {searchTerm && (
                <span>Búsqueda: <span className="font-semibold text-gray-900">"{searchTerm}"</span></span>
              )}
              {searchTerm && (filtroRol || filtroSede) && <span className="mx-2">•</span>}
              {filtroRol && (
                <span>Rol: <span className="font-semibold text-gray-900">{filtroRol}</span></span>
              )}
              {filtroRol && filtroSede && <span className="mx-2">•</span>}
              {filtroSede && (
                <span>Sede: <span className="font-semibold text-gray-900">{sedes.find(s => s.id == filtroSede)?.nombre}</span></span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroRol('');
                setFiltroSede('');
              }}
              className="text-sm text-[#39A900] hover:text-[#007832] font-medium flex items-center gap-1 transition-colors duration-150 ml-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sede
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium">
                        {searchTerm || filtroRol || filtroSede ? 'No se encontraron usuarios con los filtros aplicados' : 'No hay usuarios registrados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map(usuario => (
                  <tr key={usuario.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{usuario.nombre}</p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{usuario.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles.map(rol => (
                          <span
                            key={rol.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rol.es_principal
                                ? 'bg-[#39A900] text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {rol.nombre}
                            {rol.es_principal && <span className="ml-1">★</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">
                        {usuario.roles.length > 0 && usuario.roles[0].sede_nombre 
                          ? usuario.roles[0].sede_nombre 
                          : 'Sin sede asignada'
                        }
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => seleccionarUsuario(usuario)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#39A900] hover:bg-[#007832] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#39A900] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {!loading && usuariosFiltrados.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={usuariosFiltrados.length}
          itemsPerPage={itemsPerPage}
          itemName="usuarios"
        />
      )}

      {/* Modal de edición */}
      {showModal && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#39A900] to-[#007832] text-white px-8 py-5 flex justify-between items-center rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">Asignar Roles y Sede</h3>
              </div>
              <button
                onClick={cerrarModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-8 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Información del usuario:</p>
                <p className="font-semibold text-gray-800">{usuarioSeleccionado.nombre}</p>
                <p className="text-sm text-gray-600">{usuarioSeleccionado.email}</p>
                <p className="text-sm text-gray-600">Documento: {usuarioSeleccionado.id}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="font-semibold text-gray-700 mb-3">Asignar roles:</p>
                  <p className="text-xs text-gray-500 mb-4">* El rol "usuario" es obligatorio y no se puede quitar</p>

                  <div className="space-y-3">
                    {roles.map(rol => {
                      const esRolUsuario = rol.id === rolUsuarioId;
                      const estaSeleccionado = rolesSeleccionados.includes(rol.id);

                      return (
                        <div
                          key={rol.id}
                          className={`flex items-center justify-between p-4 border rounded-lg ${
                            esRolUsuario ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={estaSeleccionado}
                              onChange={() => toggleRol(rol.id)}
                              disabled={esRolUsuario}
                              className="w-5 h-5 text-[#39A900] rounded focus:ring-[#39A900] disabled:opacity-50"
                            />
                            <div>
                              <p className="font-medium text-gray-800">
                                {rol.nombre}
                                {esRolUsuario && <span className="ml-2 text-xs text-blue-600">(Obligatorio)</span>}
                              </p>
                            </div>
                          </div>

                          {estaSeleccionado && (
                            <button
                              onClick={() => setRolPrincipal(rol.id)}
                              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                                rolPrincipal === rol.id
                                  ? 'bg-[#39A900] text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {rolPrincipal === rol.id ? '★ Principal' : 'Hacer Principal'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-gray-700 mb-3">Asignar sede:</p>
                  <select
                    value={sedeSeleccionada || ''}
                    onChange={(e) => setSedeSeleccionada(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39A900] focus:border-transparent"
                  >
                    <option value="">Seleccionar sede...</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={cerrarModal}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <Button
                onClick={guardarCambios}
                className="px-6 py-3"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
