import React from 'react';

type AppView = 'main' | 'clients' | 'control_panel' | 'settings' | 'performance';
type User = 'admin' | 'user';

interface NavbarProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    dbStatus: boolean;
    currentUser: User;
    onSwitchUser: (user: User) => void;
    isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, dbStatus, currentUser, onSwitchUser, isAdmin }) => {
    
    const navItems: { view: AppView; label: string; adminOnly: boolean; }[] = [
        { view: 'main', label: 'Análisis de Creativos', adminOnly: false },
        { view: 'performance', label: 'Rendimiento', adminOnly: false },
        { view: 'clients', label: 'Clientes', adminOnly: false },
        { view: 'control_panel', label: 'Panel de Control', adminOnly: true },
        { view: 'settings', label: 'Configuración', adminOnly: false },
    ];

    return (
        <nav className="bg-brand-surface p-4 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {navItems.map(item => {
                    if (item.adminOnly && !isAdmin) return null;
                    return (
                        <button 
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className={`font-semibold transition-colors ${currentView === item.view ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text'}`}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center gap-4">
                 {/* DB Status */}
                <div className="flex items-center gap-2 text-sm">
                    <div className="relative flex items-center justify-center">
                        <span className={`absolute h-3 w-3 rounded-full ${dbStatus ? 'bg-green-500' : 'bg-red-500'} opacity-75 animate-ping`}></span>
                        <span className={`h-2 w-2 rounded-full ${dbStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                    <span className="text-brand-text-secondary">
                        {dbStatus ? 'DB Conectada' : 'DB Desconectada'}
                    </span>
                </div>

                {/* User Switcher (Simulation) */}
                 <div className="flex items-center gap-2 text-sm p-1 bg-brand-border rounded-md">
                    <button onClick={() => onSwitchUser('user')} className={`px-2 py-1 rounded-sm text-xs transition-colors ${currentUser === 'user' ? 'bg-brand-primary text-white shadow' : 'text-brand-text-secondary hover:bg-brand-surface'}`}>User</button>
                    <button onClick={() => onSwitchUser('admin')} className={`px-2 py-1 rounded-sm text-xs transition-colors ${currentUser === 'admin' ? 'bg-brand-primary text-white shadow' : 'text-brand-text-secondary hover:bg-brand-surface'}`}>Admin</button>
                 </div>
            </div>
        </nav>
    );
};
