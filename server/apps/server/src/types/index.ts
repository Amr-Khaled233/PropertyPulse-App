// Server-only types, including the Express Request augmentation used by auth middleware.

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by auth.middleware once a valid bearer token is verified. */
      user?: AuthUser;
    }
  }
}

export {};
