import { CaipAssetType, CaipChainId } from '@metamask/keyring-api';
import { MultichainNetworks } from './networks';

export const MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 = {
  BTC: `${MultichainNetworks.BITCOIN}/slip44:0`,
  tBTC: `${MultichainNetworks.BITCOIN_TESTNET}/slip44:0`,
  sBTC: `${MultichainNetworks.BITCOIN_SIGNET}/slip44:0`,
  SOL: `${MultichainNetworks.SOLANA}/slip44:501`,
  TRX: `${MultichainNetworks.TRON}/slip44:195`,
} as const;

export enum MultichainNativeAssets {
  BITCOIN = `${MultichainNetworks.BITCOIN}/slip44:0`,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BITCOIN_TESTNET = `${MultichainNetworks.BITCOIN_TESTNET}/slip44:0`,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BITCOIN_SIGNET = `${MultichainNetworks.BITCOIN_SIGNET}/slip44:0`,

  SOLANA = `${MultichainNetworks.SOLANA}/slip44:501`,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SOLANA_DEVNET = `${MultichainNetworks.SOLANA_DEVNET}/slip44:501`,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SOLANA_TESTNET = `${MultichainNetworks.SOLANA_TESTNET}/slip44:501`,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TRON = `${MultichainNetworks.TRON}/slip44:195`,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TRON_NILE = `${MultichainNetworks.TRON_NILE}/slip44:195`,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TRON_SHASTA = `${MultichainNetworks.TRON_SHASTA}/slip44:195`,
}

/**
 * Maps network identifiers to their corresponding native asset types.
 * Each network is mapped to an array containing its native asset for consistency.
 */
export const MULTICHAIN_NETWORK_TO_ASSET_TYPES: Record<
  CaipChainId,
  CaipAssetType[]
> = {
  [MultichainNetworks.SOLANA]: [MultichainNativeAssets.SOLANA],
  [MultichainNetworks.SOLANA_TESTNET]: [MultichainNativeAssets.SOLANA_TESTNET],
  [MultichainNetworks.SOLANA_DEVNET]: [MultichainNativeAssets.SOLANA_DEVNET],
  [MultichainNetworks.BITCOIN]: [MultichainNativeAssets.BITCOIN],
  [MultichainNetworks.BITCOIN_TESTNET]: [
    MultichainNativeAssets.BITCOIN_TESTNET,
  ],
  [MultichainNetworks.BITCOIN_SIGNET]: [MultichainNativeAssets.BITCOIN_SIGNET],
  [MultichainNetworks.TRON]: [MultichainNativeAssets.TRON],
  [MultichainNetworks.TRON_NILE]: [MultichainNativeAssets.TRON_NILE],
  [MultichainNetworks.TRON_SHASTA]: [MultichainNativeAssets.TRON_SHASTA],
} as const;
