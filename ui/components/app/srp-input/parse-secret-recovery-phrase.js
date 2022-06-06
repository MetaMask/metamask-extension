export const parseSecretRecoveryPhrase = (seedPhrase) =>
  (seedPhrase || '').trim().toLowerCase().match(/\w+/gu)?.join(' ') || '';
