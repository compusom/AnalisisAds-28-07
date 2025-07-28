import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UserAccount } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserAccount) => void;
  initialData: UserAccount | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data: UserAccount = {
      id: initialData?.id || crypto.randomUUID(),
      name: name.trim(),
    };
    onSave(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-brand-surface rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md relative">
        <h2 className="text-2xl font-bold text-brand-text mb-6">
          {initialData ? 'Editar Usuario' : 'Añadir Usuario'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
            placeholder="Nombre"
            required
          />
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-brand-border hover:bg-brand-border/70 text-brand-text font-bold py-2 px-4 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
              Guardar
            </button>
          </div>
        </form>
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </Modal>
  );
};
