import { KEYRING_TYPES_SUPPORTING_7702 } from '../../../shared/constants/keyring';

/** Minimal shape; KeyringController.getKeyringForAccount is typed as Promise<unknown>. */
type KeyringControllerLike = {
  getKeyringForAccount: (address: string) => Promise<unknown>;
};

/**
 * Returns whether the given account's keyring supports EIP-7702 gas fee tokens.
 * Used to avoid requesting 7702 from sentinel for hardware and other unsupported keyrings.
 *
 * @param address - Account address (e.g. request.from or transactionMeta.txParams?.from).
 * @param keyringControllerOrGetter - KeyringController instance or a function that returns it.
 * @returns True if the account supports 7702 (or address is missing / lookup fails; assume supported).
 */
export async function accountSupports7702(
  address: string | undefined,
  keyringControllerOrGetter:
    | KeyringControllerLike
    | (() => KeyringControllerLike),
): Promise<boolean> {
  if (!address) {
    return true;
  }
  const keyringController =
    typeof keyringControllerOrGetter === 'function'
      ? keyringControllerOrGetter()
      : keyringControllerOrGetter;
  try {
    const keyring = await keyringController.getKeyringForAccount(address);
    const keyringType =
      keyring &&
      typeof keyring === 'object' &&
      'type' in keyring &&
      typeof (keyring as { type: unknown }).type === 'string'
        ? (keyring as { type: string }).type
        : '';
    return KEYRING_TYPES_SUPPORTING_7702.includes(keyringType as never);
  } catch {
    return true;
  }
}
