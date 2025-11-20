import mongoose, {  Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../../shared/types';

const userSchema: Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin','seller','super-admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  // ensure TypeScript treats password as a string when hashing
  this.password = await bcrypt.hash(this.password as string, 12);
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword: string, userPassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export default mongoose.model<IUser>('User', userSchema);