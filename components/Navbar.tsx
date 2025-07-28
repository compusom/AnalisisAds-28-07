import React from 'react';
import { UserAccount } from '../types';

type AppView = 'main' | 'clients' | 'users' | 'control_panel' | 'settings' | 'performance';
type User = 'admin' | string;

interface NavbarProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    dbStatus: boolean;
    currentUser: User;
    onSwitchUser: (user: User) => void;
    isAdmin: boolean;
    users: UserAccount[];
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, dbStatus, currentUser, onSwitchUser, isAdmin, users }) => {
    
    const navItems: { view: AppView; label: string; adminOnly: boolean; }[] = [
        { view: 'main', label: 'Análisis de Creativos', adminOnly: false },
        { view: 'performance', label: 'Rendimiento', adminOnly: false },
        { view: 'clients', label: 'Clientes', adminOnly: false },
        { view: 'users', label: 'Usuarios', adminOnly: true },
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

                {/* User Switcher */}
                <select
                    value={currentUser}
                    onChange={e => onSwitchUser(e.target.value)}
                    className="text-sm bg-brand-border p-1 rounded-md text-brand-text"
                >
                    <option value="admin">Admin</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
        </nav>
    );
};
