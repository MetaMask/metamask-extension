import type { StateCorruptionErrorType } from './critical-error';

export type ErrorLike = {
  message: string;
  name?: string;
  stack?: string;
  cause?: unknown;
  sentryTags?: Record<string, string>;
  /**
   * The type of state corruption, when the failure makes persisted state
   * unusable.
   */
  corruptionType?: StateCorruptionErrorType;
};

// This error is emitted from background.js and meant to be handled in the ui
export const MISSING_VAULT_ERROR =
  'Data error: storage.local does not contain vault data';

export const INACCESSIBLE_DATABASE_ERROR =
  'Data error: storage.local is not accessible';

// This error comes from the browser. Some more details are here https://github.com/MetaMask/metamask-extension/issues/25728
export const CORRUPTION_BLOCK_CHECKSUM_MISMATCH =
  'Corruption: block checksum mismatch';
