/**
 * Default address scope: which chain namespace is used when showing a single
 * "default" address (e.g. in the account list hover or in Settings).
 */
export const DEFAULT_ADDRESS_OPTIONS = [
  { value: 'eip155', messageKey: 'ethereumAndEvms' },
  { value: 'solana', messageKey: 'networkNameSolana' },
  { value: 'bip122', messageKey: 'networkNameBitcoin' },
  { value: 'tron', messageKey: 'networkNameTron' },
];

/**
 * Scope → i18n message key for the "Default: X" display label for default address.
 * For eip155 uses "Ethereum"; other scopes match the Settings keys.
 */
export const DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE: Record<string, string> =
  Object.fromEntries(
    DEFAULT_ADDRESS_OPTIONS.map((opt) => [
      opt.value,
      opt.value === 'eip155' ? 'networkNameEthereum' : opt.messageKey,
    ]),
  );
