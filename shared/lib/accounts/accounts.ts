<<<<<<< HEAD
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import { DiscoveredAccount, KeyringAccount } from '@metamask/keyring-api';
import { SnapId } from '@metamask/snaps-sdk';
import { MultichainNetworks } from '../../constants/multichain/networks';
=======
import type { InternalAccount } from '@metamask/keyring-internal-api';
>>>>>>> main
import { HardwareDeviceNames } from '../../constants/hardware-wallets';

export function isHardwareAccount(account: InternalAccount): boolean {
  try {
    const keyringType = account?.metadata?.keyring?.type;
    return Object.values(HardwareDeviceNames).includes(
      keyringType as HardwareDeviceNames,
    );
  } catch {
    return false;
  }
}
<<<<<<< HEAD

export type CreateAccountSnapOptions = {
  scope?: CaipChainId;
  derivationPath?: DiscoveredAccount['derivationPath'];
  entropySource?: string;
  accountNameSuggestion?: string;
  synchronize?: boolean;
};

export type WalletSnapClient = {
  getSnapId(): SnapId;

  createAccount(options: CreateAccountSnapOptions): Promise<KeyringAccount>;

  getNextAvailableAccountName(
    options?: SnapAccountNameOptions,
  ): Promise<string>;
};
=======
>>>>>>> main
