/**
 * Role display helper for DelightOS
 * Maps database/auth roles to human-readable labels in Spanish.
 */
export function getRoleDisplayName(role: string | undefined): string {
  if (!role) return 'Colaborador';

  const cleanRole = role.toLowerCase().trim();

  switch (cleanRole) {
    case 'admin':
    case 'administrador':
      return 'Administrador';
    case 'manager':
    case 'gerente':
      return 'Gerente';
    case 'cashier':
    case 'cajero':
    case 'caja':
      return 'Cajero';
    case 'kitchen':
    case 'cocina':
    case 'kds':
      return 'Cocina';
    case 'staff':
    case 'colaborador':
      return 'Colaborador';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}
