import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import { DiscoveredAccount, KeyringAccount } from '@metamask/keyring-api';
import { SnapId } from '@metamask/snaps-sdk';
import { MultichainNetworks } from '../../constants/multichain/networks';
import { HardwareDeviceNames } from '../../constants/hardware-wallets';
import { BITCOIN_WALLET_SNAP_ID } from './bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from './solana-wallet-snap';
import { TRON_WALLET_SNAP_ID } from './tron-wallet-snap';

/**
 * Supported non-EVM Snaps.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type SUPPORTED_WALLET_SNAP_ID =
  | typeof SOLANA_WALLET_SNAP_ID
  | typeof BITCOIN_WALLET_SNAP_ID
  | typeof TRON_WALLET_SNAP_ID;

export type SnapAccountNameOptions = {
  chainId?: CaipChainId;
};

/**
 * Get the next available Snap account name for a supported non-EVM Snap.
 *
 * @param getNextAvailableAccountName - Callback to get the next available account name.
 * @param snapId - Snap ID.
 * @param options - Options for this account name.
 * @param options.chainId - Chain ID for this account if available.
 * @returns
 */
export async function getNextAvailableSnapAccountName(
  getNextAvailableAccountName: () => Promise<string>,
  snapId: SUPPORTED_WALLET_SNAP_ID,
  { chainId }: SnapAccountNameOptions = {},
) {
  const defaultSnapAccountName = await getNextAvailableAccountName();

  // FIXME: This is a temporary workaround to suggest a different account name for a first party snap.
  const accountNumber = defaultSnapAccountName.trim().split(' ').pop();

  switch (snapId) {
    case BITCOIN_WALLET_SNAP_ID: {
      if (chainId === MultichainNetworks.BITCOIN_TESTNET) {
        return `Bitcoin Testnet Account ${accountNumber}`;
      }
      if (chainId === MultichainNetworks.BITCOIN_SIGNET) {
        return `Bitcoin Signet Account ${accountNumber}`;
      }
      return `Bitcoin Account ${accountNumber}`;
    }
    case SOLANA_WALLET_SNAP_ID: {
      // Solana accounts should have in their scope the 3 networks
      // mainnet, testnet, and devnet. Therefore, we can use this name
      // for all 3 networks.
      return `Solana Account ${accountNumber}`;
    }
    case TRON_WALLET_SNAP_ID: {
      return `Tron Account ${accountNumber}`;
    }
    default:
      return defaultSnapAccountName;
  }
}

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

