import { Hex } from 'viem';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { SUPPORTED_HARDWARE_WALLET_TYPES } from '../../pages/remote-mode/remote.constants';
import { NETWORK_TO_NAME_MAP } from '../../../shared/constants/network';

export function isRemoteModeSupported(account: InternalAccount) {
  // todo: add check that account also implements signEip7702Authorization()
  return SUPPORTED_HARDWARE_WALLET_TYPES.includes(
    account.metadata.keyring.type,
  );
}

export function getChainNamesForDisplayByIds(chainIds: Hex[]): string {
  return chainIds
    .map(
      (id) =>
        NETWORK_TO_NAME_MAP[id as keyof typeof NETWORK_TO_NAME_MAP] ||
        `Unknown(${id})`,
    )
    .join(', ');
}
