/** Mock user accounts. Replaced by Supabase Auth users later. */
import type { AuthUser } from "@/types/api/auth.contracts";

export interface MockAccount {
  password: string;
  user: AuthUser;
}

export const mockAccounts: Record<string, MockAccount> = {
  "student@sensei.ai": {
    password: "student",
    user: {
      id: "user-student",
      email: "student@sensei.ai",
      name: "Nour Atef",
      role: "student",
      initials: "AR",
    },
  },
  "reviewer@sensei.ai": {
    password: "reviewer",
    user: {
      id: "user-reviewer",
      email: "reviewer@sensei.ai",
      name: "Name 3",
      role: "reviewer",
      initials: "NP",
    },
  },
  "admin@sensei.ai": {
    password: "admin",
    user: {
      id: "user-admin",
      email: "admin@sensei.ai",
      name: "Yousef Alaa",
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
