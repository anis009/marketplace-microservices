export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// TODO: ordered low to high privilege
export const ROLE_HIERARCHY: Role[] = [
  ROLES.CUSTOMER,
  ROLES.SELLER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

export const VALID_ROLES: Role[] = [...ROLE_HIERARCHY];

// TODO: role assignment rules
export const ROLE_ASSIGNMENTS: Record<Role, Role[]> = {
  [ROLES.CUSTOMER]: [],
  [ROLES.SELLER]: [],
  [ROLES.ADMIN]: [ROLES.CUSTOMER, ROLES.SELLER],
  [ROLES.SUPER_ADMIN]: VALID_ROLES,
};

// TODO: check if assigner can give target role
export function canAssignRole(assigner: Role, target: Role): boolean {
  return ROLE_ASSIGNMENTS[assigner]?.includes(target) ?? false;
}

// TODO: check if roleA outranks roleB
export function hasHigherPrivilege(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY.indexOf(roleA) > ROLE_HIERARCHY.indexOf(roleB);
}
