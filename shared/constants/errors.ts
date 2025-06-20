export type ErrorLike = {
  message: string;
  name: string;
  stack?: string;
};

// This error is emitted from background.js and meant to be handled in the ui
export const MISSING_VAULT_ERROR =
  'Data error: storage.local does not contain vault data';

// This error comes from the browser. Some more details are here https://github.com/MetaMask/metamask-extension/issues/25728
export const CORRUPTION_BLOCK_CHECKSUM_MISMATCH =
  'Corruption: block checksum mismatch';

export function isStateCorruptionError(err: ErrorLike) {
  return (
    err.message === MISSING_VAULT_ERROR ||
    err.message === CORRUPTION_BLOCK_CHECKSUM_MISMATCH
  );
}
