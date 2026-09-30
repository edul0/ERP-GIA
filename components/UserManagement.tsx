import React, { useState, useEffect, useMemo } from 'react';
import { User, Role } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface UserManagementProps {
    users: User[];
    onAddUser: (username: string, password: string, role: Role) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('user');
    
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isEditing = !!userToEdit;

    useEffect(() => {
        if (userToEdit) {
            setUsername(userToEdit.username);
            setRole(userToEdit.role);
            setPassword(''); // Clear password field for security
        } else {
            // Reset form when not editing (e.g., after submission or cancellation)
            setUsername('');
            setPassword('');
            setRole('user');
        }
    }, [userToEdit]);
    
    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return users;
        }
        return users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isEditing) {
            if (username.trim() === '') {
                alert('O nome de usuário não pode estar vazio.');
                return;
            }
            // Security check: prevent admin from demoting themselves
            if (userToEdit.id === currentUser.id && role === 'user') {
                alert('Você não pode remover sua própria permissão de administrador.');
                setRole('admin'); // Revert role change in the form
                return;
            }
            const updatedUser: User = {
                ...userToEdit,
                username: username.trim(),
                role,
                // Only update password if a new one is provided
                password: password.trim() === '' ? userToEdit.password : password.trim(),
            };
            onUpdateUser(updatedUser);
            alert('Usuário atualizado com sucesso!');
        } else {
            if (username.trim() === '' || password.trim() === '') {
                alert('Por favor, preencha o nome de usuário e a senha.');
                return;
            }
            onAddUser(username, password, role);
            alert('Usuário criado com sucesso!');
        }

        setUserToEdit(null); // This will trigger the useEffect to reset the form
    };

    const handleCancelEdit = () => {
        setUserToEdit(null);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Add/Edit User Form */}
                <div className="bg-white p-8 rounded-lg shadow-md h-fit">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                        {isEditing ? `Editar Usuário: ${userToEdit.username}` : 'Criar Novo Usuário'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="new-username" className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário</label>
                            <input
                                id="new-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="new-password"className="block text-sm font-medium text-gray-700 mb-1">
                                Senha {isEditing && <span className="text-xs text-gray-500">(deixe em branco para não alterar)</span>}
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
                                required={!isEditing}
                            />
                        </div>
                        <div>
                            <label htmlFor="new-role" className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                            <select
                                id="new-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
                            >
                                <option value="user">Usuário</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="pt-2 flex justify-end space-x-3">
                             {isEditing && (
                                <button type="button" onClick={handleCancelEdit} className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">
                                    Cancelar
                                </button>
                            )}
                            <button type="submit" className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                               {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                            </button>
                        </div>
                    </form>
                </div>
                {/* User List */}
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                        Usuários Existentes
                    </h2>
                    <div className="mb-4">
                        <label htmlFor="user-search" className="sr-only">Pesquisar Usuário</label>
                        <input
                            id="user-search"
                            type="text"
                            placeholder="Pesquisar por nome de usuário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                                <div>
                                    <span className="font-medium text-gray-700">{user.username}</span>
                                    <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full ${
                                        user.role === 'admin' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-brand-100 text-brand-800'
                                    }`}>
                                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button 
                                        onClick={() => setUserToEdit(user)} 
                                        className="p-2 text-gray-500 rounded-full hover:bg-yellow-100 hover:text-yellow-600 transition-colors" 
                                        aria-label={`Editar ${user.username}`}>
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    {/* Prevent admin from deleting themselves */}
                                    {user.id !== currentUser.id && (
                                        <button 
                                            onClick={() => setUserToDelete(user)} 
                                            className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors" 
                                            aria-label={`Excluir ${user.username}`}>
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )) : (
                             <p className="text-center text-gray-500 py-4">Nenhum usuário encontrado.</p>
                        )}
                    </div>
                </div>
            </div>
            {userToDelete && (
                <ConfirmationModal
                    isOpen={!!userToDelete}
                    title="Confirmar Exclusão de Usuário"
                    message={`Tem certeza que deseja excluir o usuário "${userToDelete.username}"? Esta ação não pode ser desfeita.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setUserToDelete(null)}
                />
            )}
        </>
    )
}

export default UserManagement;