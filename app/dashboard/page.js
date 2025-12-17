'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  PackageIcon,
  UsersIcon,
  ClipboardIcon
} from '../components/Icons';

// Componentes de dashboard según rol
const DashboardCuentadante = () => {
  const [stats, setStats] = useState({
    bienesACargo: 0,
    bienesDisponibles: 0,
    bienesEnPrestamo: 0,
    solicitudesPendientes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.documento) return;

        const response = await fetch(`/api/dashboard/stats?rol=cuentadante&documento=${userData.documento}`);
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Bienes Bajo Mi Cuidado"
        value={loading ? '...' : stats.bienesACargo.toString()}
        icon={<PackageIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Bienes Disponibles para Préstamo"
        value={loading ? '...' : stats.bienesDisponibles.toString()}
        icon={<CheckCircleIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Bienes En Préstamo"
        value={loading ? '...' : stats.bienesEnPrestamo.toString()}
        icon={<AlertIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Solicitudes Pendientes"
        value={loading ? '...' : stats.solicitudesPendientes.toString()}
        icon={<ClipboardIcon className="w-8 h-8" />}
      />
    </div>
  );
};

const DashboardAdministrador = () => {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    solicitudesAprobadas: 0,
    totalSolicitudes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats?rol=administrador');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Solicitudes"
        value={loading ? '...' : stats.totalSolicitudes.toString()}
        icon={<ClipboardIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Usuarios en el Sistema"
        value={loading ? '...' : stats.totalUsuarios.toString()}
        icon={<UsersIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Solicitudes Aprobadas"
        value={loading ? '...' : stats.solicitudesAprobadas.toString()}
        icon={<CheckCircleIcon className="w-8 h-8" />}
      />
    </div>
  );
};

const DashboardAlmacenista = ({ router }) => {
  const [stats, setStats] = useState({
    totalBienes: 0,
    bienesSinAsignar: 0,
    cuentadantesActivos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Bienes Registrados"
        value={loading ? '...' : stats.totalBienes.toString()}
        icon={<PackageIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Sin Asignar"
        value={loading ? '...' : stats.bienesSinAsignar.toString()}
        icon={<AlertIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Cuentadantes Activos"
        value={loading ? '...' : stats.cuentadantesActivos.toString()}
        icon={<UsersIcon className="w-8 h-8" />}
      />
    </div>
  );
};

const DashboardVigilante = () => {
  const [stats, setStats] = useState({
    pendientesAutorizacion: 0,
    enPrestamo: 0,
    devueltos: 0
  });
  const [loading, setLoading] = useState(true);
  const [sinSedeAsignada, setSinSedeAsignada] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.documento) return;

        const response = await fetch(`/api/dashboard/stats?rol=vigilante&documento=${userData.documento}`);
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setSinSedeAsignada(data.sinSedeAsignada || false);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (sinSedeAsignada) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertIcon className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Sede no asignada</h3>
              <p className="text-yellow-700 mt-1">
                No tienes una sede asignada. Para poder autorizar salidas y registrar devoluciones, necesitas que el administrador te asigne una sede.
              </p>
              <p className="text-yellow-600 text-sm mt-2">
                Contacta al administrador del sistema para que te asigne una sede.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Pendientes de Autorización"
        value={loading ? '...' : stats.pendientesAutorizacion.toString()}
        icon={<AlertIcon className="w-8 h-8" />}
      />
      <StatCard
        title="En Préstamo"
        value={loading ? '...' : stats.enPrestamo.toString()}
        icon={<PackageIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Devueltos Hoy"
        value={loading ? '...' : stats.devueltos.toString()}
        icon={<CheckCircleIcon className="w-8 h-8" />}
      />
    </div>
  );
};

const DashboardUsuario = () => {
  const [stats, setStats] = useState({
    solicitudesActivas: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.documento) return;

        const response = await fetch(`/api/dashboard/stats?rol=usuario&documento=${userData.documento}`);
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Solicitudes Activas"
        value={loading ? '...' : stats.solicitudesActivas.toString()}
        icon={<AlertIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Aprobadas"
        value={loading ? '...' : stats.solicitudesAprobadas.toString()}
        icon={<CheckCircleIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Rechazadas"
        value={loading ? '...' : stats.solicitudesRechazadas.toString()}
        icon={<ClipboardIcon className="w-8 h-8" />}
      />
    </div>
  );
};

const DashboardCoordinador = () => {
  const [stats, setStats] = useState({
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0
  });
  const [loading, setLoading] = useState(true);
  const [sinSedeAsignada, setSinSedeAsignada] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.documento) return;

        const response = await fetch(`/api/dashboard/stats?rol=coordinador&documento=${userData.documento}`);
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setSinSedeAsignada(data.sinSedeAsignada || false);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (sinSedeAsignada) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertIcon className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Sede no asignada</h3>
              <p className="text-yellow-700 mt-1">
                No tienes una sede asignada. Para poder revisar y aprobar solicitudes, necesitas que el administrador te asigne una sede.
              </p>
              <p className="text-yellow-600 text-sm mt-2">
                Contacta al administrador del sistema para que te asigne una sede.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Pendientes de Firmar"
        value={loading ? '...' : stats.solicitudesPendientes.toString()}
        icon={<AlertIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Aprobadas"
        value={loading ? '...' : stats.solicitudesAprobadas.toString()}
        icon={<CheckCircleIcon className="w-8 h-8" />}
      />
      <StatCard
        title="Rechazadas"
        value={loading ? '...' : stats.solicitudesRechazadas.toString()}
        icon={<ClipboardIcon className="w-8 h-8" />}
      />
    </div>
  );
};

// Updated StatCard - White Design with Green Accents (SENA Style)
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-[#39A900]/5 rounded-xl group-hover:bg-[#39A900]/10 transition-colors text-[#39A900]">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Actual</span>
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-gray-900 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Cargar usuario desde localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F7F8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39A900]"></div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.rol) {
      case 'cuentadante':
        return <DashboardCuentadante />;
      case 'administrador':
        return <DashboardAdministrador router={router} />;
      case 'almacenista':
        return <DashboardAlmacenista router={router} />;
      case 'vigilante':
        return <DashboardVigilante />;
      case 'usuario':
        return <DashboardUsuario />;
      case 'coordinador':
        return <DashboardCoordinador />;
      default:
        return <div>Rol no reconocido</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F8]">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
