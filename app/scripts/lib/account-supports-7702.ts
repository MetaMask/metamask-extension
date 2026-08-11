import { KeyringControllerGetKeyringForAccountAction } from '@metamask/keyring-controller';
import { KEYRING_TYPES_SUPPORTING_7702 } from '../../../shared/constants/keyring';
import { RootMessenger } from './messenger';

/** Minimal shape; KeyringController.getKeyringForAccount is typed as Promise<unknown>. */
type KeyringControllerLike = {
  getKeyringForAccount: (address: string) => Promise<unknown>;
};

/** Messenger able to resolve the keyring for an account. */
type AccountSupports7702Messenger = RootMessenger<
  KeyringControllerGetKeyringForAccountAction,
  never
>;

/**
 * Returns whether the given account's keyring supports EIP-7702 gas fee tokens.
 * Used to avoid requesting 7702 from sentinel for hardware and other unsupported keyrings.
 *
 * @param address - Account address (e.g. request.from or transactionMeta.txParams?.from).
 * @param keyringSource - A KeyringController instance, a function that returns
 * it, or a messenger that can call `KeyringController:getKeyringForAccount`.
 * @returns True if the account supports 7702 (or address is missing / lookup fails; assume supported).
 */
export async function accountSupports7702(
  address: string | undefined,
  keyringSource:
    | KeyringControllerLike
    | (() => KeyringControllerLike)
    | AccountSupports7702Messenger,
): Promise<boolean> {
  if (!address) {
    return true;
  }
  const resolved =
    typeof keyringSource === 'function' ? keyringSource() : keyringSource;
  try {
    const keyring =
      'getKeyringForAccount' in resolved
        ? await resolved.getKeyringForAccount(address)
        : await resolved.call(
            'KeyringController:getKeyringForAccount',
            address,
          );
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
