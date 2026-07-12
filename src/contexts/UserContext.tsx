import React, { createContext, useContext } from 'react';
import { User } from '../types';
import { useSystemContext } from './SystemContext';
import { saveUsersToSupabase } from '../lib/supabaseService';
import { isSupabaseActive } from '../lib/supabase';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  login: (user: User) => void;
  logout: () => void;
  updateUsers: (updated: User[]) => Promise<void>;
  hasAccess: (requiredRoles: ('admin' | 'manager' | 'cashier')[]) => boolean;
  setUsersState: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, users, setUsers, addAuditLog, systemConfig, setActiveTab } = useSystemContext();

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('delight_current_user', JSON.stringify(user));
    addAuditLog('Iniciar Sesión', 'N/A', `Sesión iniciada: ${user.name} (${user.role})`, 'Seguridad', user);
  };

  const logout = () => {
    addAuditLog('Cerrar Sesión', `Sesión activa de: ${currentUser?.name}`, 'Sesión finalizada. Sesión, caché y datos temporales liberados.', 'Seguridad', currentUser);
    localStorage.removeItem('delight_current_user');
    sessionStorage.clear();
    setCurrentUser(null);
    setActiveTab('pos');
  };

  const updateUsers = async (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('delight_users', JSON.stringify(updatedUsers));
    
    await addAuditLog(
      'Mantenimiento de Usuarios',
      'Actualización de catálogo de colaboradores',
      `Total colaboradores: ${updatedUsers.length}`,
      'Seguridad',
      currentUser
    );

    if (isSupabaseActive) {
      try {
        await saveUsersToSupabase(updatedUsers, systemConfig);
      } catch (e) {
        console.warn('Error saving users to Supabase:', e);
      }
    }
  };

  const hasAccess = (requiredRoles: ('admin' | 'manager' | 'cashier')[]) => {
    if (!currentUser) return false;
    return requiredRoles.includes(currentUser.role);
  };

  return (
    <UserContext.Provider value={{ currentUser, users, login, logout, updateUsers, hasAccess, setUsersState: setUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserContext must be used within a UserProvider');
  return context;
};
