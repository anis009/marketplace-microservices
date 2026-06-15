"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUsers = exports.findAllUsers = exports.updateUserById = exports.saveUserLastLogin = exports.saveUserRole = exports.findUserByIdWithoutPassword = exports.findUserById = exports.createUser = exports.findUserByEmailWithPassword = exports.findUserByEmail = void 0;
const User_1 = __importDefault(require("../models/User"));
const findUserByEmail = (email) => {
    return User_1.default.findOne({ email });
};
exports.findUserByEmail = findUserByEmail;
const findUserByEmailWithPassword = (email) => {
    return User_1.default.findOne({ email }).select('+password');
};
exports.findUserByEmailWithPassword = findUserByEmailWithPassword;
const createUser = ({ name, email, password, avatar }) => {
    return User_1.default.create({
        name,
        email,
        password,
        avatar,
    });
};
exports.createUser = createUser;
const findUserById = (id) => {
    return User_1.default.findById(id);
};
exports.findUserById = findUserById;
const findUserByIdWithoutPassword = (id) => {
    return User_1.default.findById(id).select('-password');
};
exports.findUserByIdWithoutPassword = findUserByIdWithoutPassword;
const saveUserRole = async (user, role) => {
    user.role = role;
    return user.save();
};
exports.saveUserRole = saveUserRole;
const saveUserLastLogin = async (user) => {
    user.lastLogin = new Date();
    return user.save();
};
exports.saveUserLastLogin = saveUserLastLogin;
const updateUserById = async (id, updates) => {
    const user = await User_1.default.findById(id);
    if (!user)
        return null;
    if (updates.name !== undefined)
        user.name = updates.name;
    if (updates.email !== undefined)
        user.email = updates.email;
    if (updates.password !== undefined)
        user.password = updates.password;
    if (updates.avatar !== undefined)
        user.avatar = updates.avatar;
    return user.save();
};
exports.updateUserById = updateUserById;
const findAllUsers = ({ skip, limit }) => {
    return User_1.default.find()
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};
exports.findAllUsers = findAllUsers;
const countUsers = () => {
    return User_1.default.countDocuments();
};
exports.countUsers = countUsers;
//# sourceMappingURL=userRepository.js.map