import React, { useState, useMemo } from 'react';
import { Client, UserAccount } from '../types';
import { ClientFormModal } from './ClientFormModal';

const CLIENTS_KEY = 'db_clients';

interface ClientManagerProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    currentUser: 'admin' | string;
    analysisCounts: { [clientId: string]: number };
    onDeleteClient: (clientId: string) => void;
    users: UserAccount[];
}

const ClientCard: React.FC<{ client: Client, analysisCount: number, onEdit: () => void, onDelete: () => void, isAdmin: boolean }> = ({ client, analysisCount, onEdit, onDelete, isAdmin }) => {
    return (
        <li className="bg-brand-border/50 p-4 rounded-md flex items-center gap-4 transition-all hover:shadow-lg hover:bg-brand-border/70 relative">
            <img src={client.logo} alt={client.name} className="h-12 w-12 rounded-full bg-brand-border object-cover flex-shrink-0" />
            <div className="flex-1">
                <p className="font-semibold text-brand-text">{client.name}</p>
                <p className="text-sm text-brand-text-secondary">Moneda: {client.currency}</p>
            </div>
            <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="font-bold text-brand-text text-lg">{analysisCount || 0}</p>
                <p className="text-xs text-brand-text-secondary">consultas</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <button onClick={onEdit} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary hover:text-white transition-colors" aria-label={`Editar cliente ${client.name}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={onDelete} className="p-2 rounded-full text-brand-text-secondary hover:bg-red-500 hover:text-white transition-colors" aria-label={`Eliminar cliente ${client.name}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
            {isAdmin && (
                <span className="text-xs text-brand-text-secondary bg-brand-border px-2 py-1 rounded-full absolute -top-2 -right-2">
                    {client.userId}
                </span>
            )}
        </li>
    );
};

export const ClientManager: React.FC<ClientManagerProps> = ({ clients, setClients, currentUser, analysisCounts, onDeleteClient, users }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const isAdmin = currentUser === 'admin';

    const visibleClients = useMemo(() => {
        if (isAdmin) return clients;
        return clients.filter(c => c.userId === currentUser);
    }, [clients, isAdmin, currentUser]);

    const clientsByUser = useMemo(() => {
        if (!isAdmin) return { [currentUser]: visibleClients } as Record<string, Client[]>;
        const groups: Record<string, Client[]> = {};
        users.forEach(u => {
            groups[u.id] = visibleClients.filter(c => c.userId === u.id);
        });
        return groups;
    }, [visibleClients, isAdmin, currentUser, users]);

    const handleOpenAddModal = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleSaveClient = (clientData: Client) => {
        const isEditing = clients.some(c => c.id === clientData.id);
        const updatedClients = isEditing
            ? clients.map(c => c.id === clientData.id ? clientData : c)
            : [...clients, clientData];
        
        setClients(updatedClients);
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
        setIsModalOpen(false);
    };
    
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-brand-surface rounded-lg p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-brand-text">
                        {isAdmin ? 'Todos los Clientes' : 'Mis Clientes'} ({visibleClients.length})
                    </h3>
                    <button onClick={handleOpenAddModal} className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Añadir Cliente
                    </button>
                </div>
                
                {Object.values(clientsByUser).some(list => list.length > 0) ? (
                    <div className="space-y-6">
                        {Object.entries(clientsByUser).map(([uid, list]) => (
                            list.length > 0 && (
                                <div key={uid}>
                                    {isAdmin && (
                                        <h4 className="font-semibold text-brand-text mb-2">{users.find(u => u.id === uid)?.name || uid}</h4>
                                    )}
                                    <ul className="space-y-4">
                                        {list.map(client => (
                                            <ClientCard
                                                key={client.id}
                                                client={client}
                                                analysisCount={analysisCounts[client.id]}
                                                onEdit={() => handleOpenEditModal(client)}
                                                onDelete={() => onDeleteClient(client.id)}
                                                isAdmin={isAdmin}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-brand-border rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="mt-4 text-brand-text-secondary">
                           No se han encontrado clientes.
                        </p>
                        <p className="text-sm text-brand-text-secondary/70">Añade uno nuevo para empezar.</p>
                    </div>
                )}
            </div>

            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveClient}
                initialData={editingClient}
                currentUser={currentUser}
            />
        </div>
    );
};