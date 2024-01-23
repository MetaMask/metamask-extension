/**
 * Computes and combines intersection types for a more "prettier" type (more human readable)
 */
export type Compute<T> = T extends T ? { [K in keyof T]: T[K] } : never;
