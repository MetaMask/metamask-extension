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

/**
 * CAIP asset type portions (namespace:reference) for Tron special assets
 * that should be filtered out from user-facing asset selectors.
 * These are virtual resources and staking state assets passed from the Tron Snap
 * to the extension for informational purposes, not actual tradeable tokens.
 */
export const TRON_SPECIAL_ASSET_CAIP_TYPES = {
  ENERGY: 'slip44:energy',
  BANDWIDTH: 'slip44:bandwidth',
  MAXIMUM_ENERGY: 'slip44:maximum-energy',
  MAXIMUM_BANDWIDTH: 'slip44:maximum-bandwidth',
  STAKED_FOR_ENERGY: 'slip44:195-staked-for-energy',
  STAKED_FOR_BANDWIDTH: 'slip44:195-staked-for-bandwidth',
  READY_FOR_WITHDRAWAL: 'slip44:195-ready-for-withdrawal',
  STAKING_REWARDS: 'slip44:195-staking-rewards',
  IN_LOCK_PERIOD: 'slip44:195-in-lock-period',
} as const;

export type TronSpecialAssetCaipType =
  (typeof TRON_SPECIAL_ASSET_CAIP_TYPES)[keyof typeof TRON_SPECIAL_ASSET_CAIP_TYPES];

export const TRON_SPECIAL_ASSET_CAIP_TYPES_SET: ReadonlySet<TronSpecialAssetCaipType> =
  new Set(
    Object.values(TRON_SPECIAL_ASSET_CAIP_TYPES) as TronSpecialAssetCaipType[],
  );

export const SLIP44_ASSET_NAMESPACE = 'slip44';
