/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { Sparkles, Lock, Mail, ShieldAlert } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [email, setEmail] = useState('delightdrinks213@gmail.com');
  const [password, setPassword] = useState('delight2026');
  const [error, setError] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === UserRole.ADMIN) {
      setEmail('delightdrinks213@gmail.com');
    } else if (role === UserRole.CASHIER) {
      setEmail('cajero@delight.com');
    } else {
      setEmail('cocina@delight.com');
    }
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Load active users from localStorage (created by admin) or fallback to initial ones
    const activeUsers: User[] = JSON.parse(localStorage.getItem('delight_users') || '[]');
    const allUsers = activeUsers.length > 0 ? activeUsers : INITIAL_USERS;

    // Check custom passwords set in localStorage or fallback to defaults
    const storedPasswords = JSON.parse(localStorage.getItem('delight_passwords') || '{}');
    const defaultPasswords: Record<string, string> = {
      'delightdrinks213@gmail.com': 'delight2026',
      'cajero@delight.com': '1234',
      'cocina@delight.com': '1234',
    };

    const validPassword = storedPasswords[email] || defaultPasswords[email];

    if (password === validPassword) {
      const user = allUsers.find((u) => u.email === email);
      if (user) {
        if (user.active === false) {
          setError('El acceso de este colaborador ha sido suspendido (inactivo).');
          return;
        }
        onLoginSuccess(user);
      } else {
        setError('Usuario no registrado en el sistema.');
      }
    } else {
      setError('Contraseña o PIN incorrecto. Intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#FFFDF8] px-4 font-sans select-none">
      {/* Liquid Glass Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-delight-green/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-delight-yellow/15 blur-[80px]" />
      <div className="absolute top-[40%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-delight-green/5 blur-[60px]" />

      <div className="w-full max-w-lg z-10">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-delight-green/5 border border-white/60 mb-4 transition-transform hover:scale-105 duration-300">
            <span className="text-3xl font-bold tracking-tight text-delight-green">Delight</span>
            <span className="text-3xl font-extrabold tracking-tight text-delight-yellow ml-1">OS</span>
          </div>
          <h2 className="text-2xl font-bold text-delight-dark tracking-tight">Delight Frappés & Drinks</h2>
          <p className="text-sm text-delight-gray/80 mt-1">Sistema Operativo de Gestión Integral</p>
        </div>

        {/* Login Frosted Card */}
        <div className="liquid-glass rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden border border-white/80">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-delight-green to-delight-yellow" />

          {/* Role selector iPad-style */}
          <div className="bg-delight-dark/5 p-1 rounded-2xl flex mb-8">
            <button
              type="button"
              id="role-btn-admin"
              onClick={() => handleRoleChange(UserRole.ADMIN)}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                selectedRole === UserRole.ADMIN
                  ? 'bg-white text-delight-dark shadow-md shadow-delight-dark/5 font-bold'
                  : 'text-delight-gray hover:text-delight-dark'
              }`}
            >
              Administrador
            </button>
            <button
              type="button"
              id="role-btn-cashier"
              onClick={() => handleRoleChange(UserRole.CASHIER)}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                selectedRole === UserRole.CASHIER
                  ? 'bg-white text-delight-dark shadow-md shadow-delight-dark/5 font-bold'
                  : 'text-delight-gray hover:text-delight-dark'
              }`}
            >
              Cajero POS
            </button>
            <button
              type="button"
              id="role-btn-kitchen"
              onClick={() => handleRoleChange(UserRole.KITCHEN)}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                selectedRole === UserRole.KITCHEN
                  ? 'bg-white text-delight-dark shadow-md shadow-delight-dark/5 font-bold'
                  : 'text-delight-gray hover:text-delight-dark'
              }`}
            >
              Cocina KDS
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl p-4 flex items-start gap-3 animate-shake">
                <ShieldAlert className="text-red-500 shrink-0 w-5 h-5" />
                <span className="text-xs text-red-700 font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-delight-dark/70 uppercase tracking-wider mb-2 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-delight-gray/50 w-5 h-5" />
                <input
                  type="email"
                  required
                  id="login-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/75 border border-delight-gray/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-delight-dark placeholder:text-delight-gray/40 outline-none focus:border-delight-green/40 focus:ring-4 focus:ring-delight-green/5 transition-all"
                  placeholder="ejemplo@delight.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-delight-dark/70 uppercase tracking-wider mb-2 ml-1">
                Contraseña / PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-delight-gray/50 w-5 h-5" />
                <input
                  type="password"
                  required
                  id="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/75 border border-delight-gray/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-delight-dark placeholder:text-delight-gray/40 outline-none focus:border-delight-green/40 focus:ring-4 focus:ring-delight-green/5 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="w-full bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-delight-green/20 hover:shadow-xl hover:shadow-delight-green/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              Ingresar al Sistema
            </button>
          </form>

          {/* Quick info credentials block for developer review */}
          <div className="mt-8 pt-6 border-t border-delight-gray/10 flex flex-col items-center">
            <span className="text-[10px] font-bold text-delight-gray/40 uppercase tracking-widest mb-2">Credenciales Oficiales</span>
            <div className="grid grid-cols-1 gap-2 w-full text-center">
              {selectedRole === UserRole.ADMIN && (
                <div className="bg-white/45 p-2.5 rounded-xl border border-delight-green/15 text-[11px] text-delight-gray">
                  <span className="font-bold text-delight-dark block mb-0.5">Administrador Inicial</span>
                  <code className="text-delight-dark block text-xs">delightdrinks213@gmail.com</code>
                  <span className="text-delight-green font-bold text-xs mt-0.5 block">Pass: delight2026</span>
                </div>
              )}
              {selectedRole === UserRole.CASHIER && (
                <div className="bg-white/45 p-2.5 rounded-xl border border-delight-green/15 text-[11px] text-delight-gray">
                  <span className="font-bold text-delight-dark block mb-0.5">Cajero Principal</span>
                  <code className="text-delight-dark block text-xs">cajero@delight.com</code>
                  <span className="text-delight-green font-bold text-xs mt-0.5 block">PIN: 1234</span>
                </div>
              )}
              {selectedRole === UserRole.KITCHEN && (
                <div className="bg-white/45 p-2.5 rounded-xl border border-delight-green/15 text-[11px] text-delight-gray">
                  <span className="font-bold text-delight-dark block mb-0.5">Cocina / KDS Principal</span>
                  <code className="text-delight-dark block text-xs">cocina@delight.com</code>
                  <span className="text-delight-green font-bold text-xs mt-0.5 block">PIN: 1234</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
