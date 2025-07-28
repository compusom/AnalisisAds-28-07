import React, { useState, useMemo } from 'react';
import { UserAccount, Client } from '../types';
import { UserFormModal } from './UserFormModal';

const USERS_KEY = 'db_users';

interface UserManagerProps {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  clients: Client[];
}

export const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, clients }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const clientCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      counts[c.userId] = (counts[c.userId] || 0) + 1;
    });
    return counts;
  }, [clients]);

  const handleSaveUser = (data: UserAccount) => {
    const exists = users.some(u => u.id === data.id);
    const updated = exists ? users.map(u => (u.id === data.id ? data : u)) : [...users, data];
    setUsers(updated);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  const handleDeleteUser = (id: string) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-brand-surface rounded-lg p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-brand-text">Usuarios ({users.length})</h3>
          <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Añadir Usuario
          </button>
        </div>

        {users.length > 0 ? (
          <ul className="space-y-4">
            {users.map(user => (
              <li key={user.id} className="bg-brand-border/50 p-4 rounded-md flex items-center justify-between">
                <div>
                  <p className="font-semibold text-brand-text">{user.name}</p>
                  <p className="text-sm text-brand-text-secondary">Clientes: {clientCounts[user.id] || 0}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary hover:text-white transition-colors" aria-label="Editar usuario">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="p-2 rounded-full text-brand-text-secondary hover:bg-red-500 hover:text-white transition-colors" aria-label="Eliminar usuario">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-brand-border rounded-lg">
            <p className="mt-4 text-brand-text-secondary">No hay usuarios registrados.</p>
          </div>
        )}
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        initialData={editingUser}
      />
    </div>
  );
};
