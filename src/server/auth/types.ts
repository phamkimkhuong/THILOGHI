export type UserRole =
  | "SALES"
  | "PRICING_SPECIALIST"
  | "PRICING_MANAGER"
  | "DIRECTOR"
  | "OPERATIONS"
  | "ACCOUNTANT"
  | "ADMIN";

export interface CurrentActor {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  regionScopes: string[]; // e.g. ["REG_QNG_QNM", "REG_SOUTH_LAOS"] or ["*"] for all
  email?: string;
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
