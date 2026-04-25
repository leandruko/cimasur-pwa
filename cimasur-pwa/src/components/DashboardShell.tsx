import React from 'react';

export const DashboardShell = ({ children, title }: { children: React.ReactNode, title: string }) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Simple */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-blue-500 mb-8">CIMASUR</h2>
        <nav className="space-y-4 flex-1">
          <a href="/dashboard" className="block p-2 hover:bg-slate-800 rounded transition-colors">Órdenes</a>
          <a href="/reportes" className="block p-2 hover:bg-slate-800 rounded transition-colors">Reportes</a>
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