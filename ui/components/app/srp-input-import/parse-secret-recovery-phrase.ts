export const parseSecretRecoveryPhrase = (seedPhrase: string) =>
  (seedPhrase || '').trim().toLowerCase().match(/\w+/gu)?.join(' ') || '';
