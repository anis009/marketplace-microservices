"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ASSIGNMENTS = exports.VALID_ROLES = exports.ROLE_HIERARCHY = exports.ROLES = void 0;
exports.canAssignRole = canAssignRole;
exports.hasHigherPrivilege = hasHigherPrivilege;
exports.ROLES = {
    CUSTOMER: 'customer',
    SELLER: 'seller',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super-admin',
};
exports.ROLE_HIERARCHY = [
    exports.ROLES.CUSTOMER,
    exports.ROLES.SELLER,
    exports.ROLES.ADMIN,
    exports.ROLES.SUPER_ADMIN,
];
exports.VALID_ROLES = [...exports.ROLE_HIERARCHY];
exports.ROLE_ASSIGNMENTS = {
    [exports.ROLES.CUSTOMER]: [],
    [exports.ROLES.SELLER]: [],
    [exports.ROLES.ADMIN]: [exports.ROLES.CUSTOMER, exports.ROLES.SELLER],
    [exports.ROLES.SUPER_ADMIN]: exports.VALID_ROLES,
};
function canAssignRole(assigner, target) {
    return exports.ROLE_ASSIGNMENTS[assigner]?.includes(target) ?? false;
}
function hasHigherPrivilege(roleA, roleB) {
    return exports.ROLE_HIERARCHY.indexOf(roleA) > exports.ROLE_HIERARCHY.indexOf(roleB);
}
//# sourceMappingURL=roles.js.map