/** Mock user accounts. Replaced by Supabase Auth users later. */
import type { AuthUser } from "@/types/api/auth.contracts";

export interface MockAccount {
  password: string;
  user: AuthUser;
}

export const mockAccounts: Record<string, MockAccount> = {
  "student@demo.com": {
    password: "student",
    user: {
      id: "user-student",
      email: "student@demo.com",
      name: "Amira Rahman",
      role: "student",
      initials: "AR",
    },
  },
  "reviewer@demo.com": {
    password: "reviewer",
    user: {
      id: "user-reviewer",
      email: "reviewer@demo.com",
      name: "Noor Patel",
      role: "reviewer",
      initials: "NP",
    },
  },
  "admin@demo.com": {
    password: "admin",
    user: {
      id: "user-admin",
      email: "admin@demo.com",
      name: "Kenji Ito",
      role: "admin",
      initials: "KI",
    },
  },
};

export const mockDemoAccounts = Object.entries(mockAccounts).map(([email, v]) => ({
  email,
  password: v.password,
  role: v.user.role,
  name: v.user.name,
}));
