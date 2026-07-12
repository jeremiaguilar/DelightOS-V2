/**
 * Role display helper for DelightOS
 * Maps database/auth roles to human-readable labels in Spanish
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
      return 'Caja';
    case 'kitchen':
    case 'cocina':
      return 'Cocina';
    default:
      return role;
  }
}
