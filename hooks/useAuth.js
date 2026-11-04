'use client';

import { useApp } from '@/context/AppProvider';
import { ROLES } from '@/lib/permissions';

export function useAuth() {
  const { ready, user, accounts, login, logout, canDo, canUser } = useApp();
  return {
    ready,
    user,
    accounts,
    role: user?.role || null,
    roleMeta: user?.role ? ROLES[user.role] : null,
    isAuthenticated: Boolean(user),
    login,
    logout,
    can: canDo,
    canUser,
  };
}

export default useAuth;
