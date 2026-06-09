import { can, type Permission, type UserRole } from '@propertypulse/shared-types';
import { useAuthStore } from '../store/authStore';

export function usePermissions() {
  const role: UserRole = useAuthStore((s) => s.user?.role) ?? 'investor';
  return {
    role,
    can: (permission: Permission) => can(role, permission),
    isAdmin: role === 'admin',
    isConsultant: role === 'consultant',
  };
}