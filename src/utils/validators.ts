export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const isStrongPassword = (v: string): boolean => v.length >= 8;

export const isNonEmpty = (v: string): boolean => v.trim().length > 0;