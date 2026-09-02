import { KeyringControllerGetKeyringForAccountAction } from '@metamask/keyring-controller';
import {
  KEYRING_TYPES_SUPPORTING_7702,
  KEYRING_TYPES_SUPPORTING_7702_RELAY,
} from '../../../shared/constants/keyring';
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

type KeyringSource =
  | KeyringControllerLike
  | (() => KeyringControllerLike)
  | AccountSupports7702Messenger;

async function keyringTypeForAccount(
  address: string | undefined,
  keyringSource: KeyringSource,
): Promise<string | undefined> {
  if (!address) {
    return undefined;
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
    return keyring &&
      typeof keyring === 'object' &&
      'type' in keyring &&
      typeof (keyring as { type: unknown }).type === 'string'
      ? (keyring as { type: string }).type
      : '';
  } catch {
    return undefined;
  }
}

/**
 * Returns whether the given account's keyring supports EIP-7702 Smart Account
 * capabilities (gas fee tokens, Tempo, bridge-batch). Excludes Money keyring —
 * those accounts are not general Smart Accounts.
 *
 * @param address - Account address (e.g. request.from or transactionMeta.txParams?.from).
 * @param keyringSource - A KeyringController instance, a function that returns
 * it, or a messenger that can call `KeyringController:getKeyringForAccount`.
 * @param fallbackOnError - Whether to assume support when the keyring lookup fails.
 * @returns True if the account supports 7702, or when the address is missing / lookup fails and fallbackOnError is true.
 */
export async function accountSupports7702(
  address: string | undefined,
  keyringSource: KeyringSource,
  fallbackOnError = true,
): Promise<boolean> {
  if (!address) {
    return true;
  }
  const keyringType = await keyringTypeForAccount(address, keyringSource);
  if (keyringType === undefined) {
    return fallbackOnError;
  }
  return KEYRING_TYPES_SUPPORTING_7702.includes(keyringType as never);
}

/**
 * Returns whether the account may publish via the EIP-7702 relay path.
 * Broader than {@link accountSupports7702}: includes Money keyring accounts
 * whose sponsored batches are externally signed and must use the relay.
 *
 * @param address - Account address.
 * @param keyringSource - Keyring controller, factory, or messenger.
 * @returns True if the account may use the 7702 relay publish hook.
 */
export async function accountSupports7702ForRelay(
  address: string | undefined,
  keyringSource: KeyringSource,
): Promise<boolean> {
  if (!address) {
    return true;
  }
  const keyringType = await keyringTypeForAccount(address, keyringSource);
  if (keyringType === undefined) {
    return true;
  }
  return KEYRING_TYPES_SUPPORTING_7702_RELAY.includes(keyringType as never);
}
