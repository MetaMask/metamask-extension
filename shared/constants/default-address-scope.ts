/**
 * Options for "Show default address" scope dropdown.
 * Values match the CaipChainId namespace prefixes used in hovered address rows
 * (e.g. scope.startsWith('eip155:'), 'bip122:', 'solana:', 'tron:').
 * messageKey is used for i18n.
 */
export const DEFAULT_ADDRESS_SCOPE_OPTIONS = [
  { value: 'eip155', messageKey: 'ethereumAndEvms' },
  { value: 'solana', messageKey: 'networkNameSolana' },
  { value: 'bip122', messageKey: 'networkNameBitcoin' },
  { value: 'tron', messageKey: 'networkNameTron' },
] as const;

export type DefaultAddressScopeValue =
  (typeof DEFAULT_ADDRESS_SCOPE_OPTIONS)[number]['value'];

/**
 * Message key for the "Default: X" label in the hover popover.
 * Derived from options so scope values (eip155, bip122, etc.) always use
 * the same i18n keys as the Settings dropdown.
 */
export const DEFAULT_ADDRESS_SCOPE_DISPLAY_KEY: Record<string, string> =
  Object.fromEntries(
    DEFAULT_ADDRESS_SCOPE_OPTIONS.map((opt) => [opt.value, opt.messageKey]),
  );
