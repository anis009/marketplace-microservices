import { z } from "zod";

export const userRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

// TypeScript type auto-generated
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
