import React from 'react';

// Dentro de DashboardShell.tsx
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`} />
      <span className="text-[10px] uppercase font-bold text-slate-400">
        {isOnline ? 'Sistema Online' : 'Modo Offline'}
      </span>
    </div>
  );
};


export const DashboardShell = ({ children, title }: { children: React.ReactNode, title: string }) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Simple */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-blue-500 mb-8">CIMASUR</h2>
          <nav className="space-y-4">
            <a href="/dashboard" className="block p-2 hover:bg-slate-800 rounded">Inicio</a>
            <a href="/dashboard/bases" className="block p-2 hover:bg-slate-800 rounded">🧪 Bases</a>
            {/* Opción de administrador */}
            <div className="pt-4 mt-4 border-t border-slate-800 text-xs text-slate-500 uppercase font-bold">Admin</div>
            <a href="/dashboard/admin/usuarios" className="block p-2 hover:bg-slate-800 rounded text-red-400">👤 Gestionar Usuarios</a>
          </nav>
        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
          Estado: <span className={navigator.onLine ? "text-green-500" : "text-amber-500"}>
            {navigator.onLine ? "● Online" : "○ Offline"}
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );



};