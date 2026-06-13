export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Ordered low → high privilege (higher index = more power)
export const ROLE_HIERARCHY: Role[] = [
  ROLES.CUSTOMER,
  ROLES.SELLER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

export const VALID_ROLES: Role[] = [...ROLE_HIERARCHY];

// A role can only assign roles less privileged than itself
export const ROLE_ASSIGNMENTS: Record<Role, Role[]> = {
  [ROLES.CUSTOMER]: [],
  [ROLES.SELLER]: [],
  [ROLES.ADMIN]: [ROLES.CUSTOMER, ROLES.SELLER],
  [ROLES.SUPER_ADMIN]: VALID_ROLES,
};

// Can `assigner` give `target` role to someone?
export function canAssignRole(assigner: Role, target: Role): boolean {
  return ROLE_ASSIGNMENTS[assigner]?.includes(target) ?? false;
}

// Does `roleA` outrank `roleB`?
export function hasHigherPrivilege(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY.indexOf(roleA) > ROLE_HIERARCHY.indexOf(roleB);
}
