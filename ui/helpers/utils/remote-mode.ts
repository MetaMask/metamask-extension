import type { InternalAccount } from '@metamask/keyring-internal-api';

const SUPPORTED_HARDWARE_WALLET_TYPES = ['Ledger Hardware', 'Lattice Hardware'];

export function isRemoteModeSupported(account: InternalAccount) {
  // todo: add check that account also implements signEip7702Authorization()
  return SUPPORTED_HARDWARE_WALLET_TYPES.includes(
    account.metadata.keyring.type,
  );
}
