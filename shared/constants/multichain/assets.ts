import { CaipAssetType } from '@metamask/keyring-api';
import { MultichainNetworks } from './networks';

export const MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 = {
  BTC: `${MultichainNetworks.BITCOIN}/slip44:0`,
  SOL: `${MultichainNetworks.SOLANA}/slip44:501`,
} as const;

export enum MultichainNativeAssets {
  BITCOIN = `${MultichainNetworks.BITCOIN}/slip44:0`,
  BITCOIN_TESTNET = `${MultichainNetworks.BITCOIN_TESTNET}/slip44:0`,

  SOLANA = `${MultichainNetworks.SOLANA}/slip44:501`,
  SOLANA_DEVNET = `${MultichainNetworks.SOLANA_DEVNET}/slip44:501`,
  SOLANA_TESTNET = `${MultichainNetworks.SOLANA_TESTNET}/slip44:501`,
}

/**
 * Maps network identifiers to their corresponding native asset types.
 * Each network is mapped to an array containing its native asset for consistency.
 */
export const MULTICHAIN_NETWORK_TO_ASSET_TYPES: Record<
  MultichainNetworks,
  CaipAssetType[]
> = {
  [MultichainNetworks.SOLANA]: [MultichainNativeAssets.SOLANA],
  [MultichainNetworks.SOLANA_TESTNET]: [MultichainNativeAssets.SOLANA_TESTNET],
  [MultichainNetworks.SOLANA_DEVNET]: [MultichainNativeAssets.SOLANA_DEVNET],
  [MultichainNetworks.BITCOIN]: [MultichainNativeAssets.BITCOIN],
  [MultichainNetworks.BITCOIN_TESTNET]: [
    MultichainNativeAssets.BITCOIN_TESTNET,
  ],
};
