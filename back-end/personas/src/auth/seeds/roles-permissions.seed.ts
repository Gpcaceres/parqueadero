/**
 * Estructura de Roles y Permisos para Parqueadero
 */

export const ROLES_CONFIG = {
  cliente: {
    name: 'cliente',
    description: 'Usuario cliente del sistema de parqueadero: solo lectura, no puede crear/modificar zonas, espacios, vehículos ni tickets (eso lo hace el personal que administra el sistema o genera el ticket).',
    permissions: [
      'auth.login',
      'auth.register',
      'auth.refresh',
      'zones.read',
      'spaces.read',
      'vehicles.read',
      'profile.read',
      'profile.update',
      'tickets.read',
    ],
  },
  admin: {
    name: 'admin',
    description: 'Administrador del sistema',
    permissions: [
      'auth.login',
      'zones.read',
      'zones.create',
      'zones.update',
      'zones.delete',
      'spaces.read',
      'spaces.create',
      'spaces.update',
      'spaces.delete',
      'vehicles.read',
      'vehicles.create',
      'vehicles.update',
      'vehicles.delete',
      'roles.read',
      'roles.create',
      'roles.update',
      'roles.delete',
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
      'users.assignRoles',
      'assignments.read',
      'assignments.create',
      'assignments.update',
      'profile.read',
      'profile.update',
      'tickets.read',
      'tickets.create',
      'tickets.update',
    ],
  },
  recaudador: {
    name: 'recaudador',
    description: 'Recaudador de pagos',
    permissions: [
      'auth.login',
      'spaces.read',
      'spaces.update',
      'vehicles.read',
      'tickets.read',
      'tickets.create',
      'tickets.update',
      'profile.read',
      'profile.update',
    ],
  },
  root: {
    name: 'root',
    description: 'Super administrador con todos los permisos',
    permissions: [
      '*', // Super poderes - acceso a todo
    ],
  },
};

export const PERMISSIONS_CONFIG = [
  // Auth
  { name: 'auth.login', description: 'Login al sistema' },
  { name: 'auth.register', description: 'Registrarse en el sistema' },
  { name: 'auth.refresh', description: 'Refrescar token JWT' },

  // Zonas
  { name: 'zones.read', description: 'Leer zonas de estacionamiento' },
  { name: 'zones.create', description: 'Crear nuevas zonas' },
  { name: 'zones.update', description: 'Actualizar zonas' },
  { name: 'zones.delete', description: 'Eliminar zonas' },

  // Espacios
  { name: 'spaces.read', description: 'Leer espacios de estacionamiento' },
  { name: 'spaces.create', description: 'Crear nuevos espacios' },
  { name: 'spaces.update', description: 'Actualizar espacios' },
  { name: 'spaces.delete', description: 'Eliminar espacios' },

  // Vehículos
  { name: 'vehicles.read', description: 'Leer vehículos' },
  { name: 'vehicles.create', description: 'Registrar vehículo' },
  { name: 'vehicles.update', description: 'Actualizar vehículo' },
  { name: 'vehicles.delete', description: 'Eliminar vehículo' },

  // Roles
  { name: 'roles.read', description: 'Leer roles' },
  { name: 'roles.create', description: 'Crear roles' },
  { name: 'roles.update', description: 'Actualizar roles' },
  { name: 'roles.delete', description: 'Eliminar roles' },

  // Usuarios
  { name: 'users.read', description: 'Leer usuarios' },
  { name: 'users.create', description: 'Crear usuarios' },
  { name: 'users.update', description: 'Actualizar usuarios' },
  { name: 'users.delete', description: 'Eliminar usuarios' },
  { name: 'users.assignRoles', description: 'Asignar roles a usuarios' },

  // Asignaciones
  { name: 'assignments.read', description: 'Leer asignaciones' },
  { name: 'assignments.create', description: 'Crear asignaciones' },
  { name: 'assignments.update', description: 'Actualizar asignaciones' },
  { name: 'assignments.delete', description: 'Eliminar asignaciones' },

  // Perfil
  { name: 'profile.read', description: 'Leer perfil propio' },
  { name: 'profile.update', description: 'Actualizar perfil propio' },

  // Tickets
  { name: 'tickets.read', description: 'Leer tickets' },
  { name: 'tickets.create', description: 'Crear tickets' },
  { name: 'tickets.update', description: 'Actualizar tickets' },
  { name: 'tickets.delete', description: 'Eliminar tickets' },
];
