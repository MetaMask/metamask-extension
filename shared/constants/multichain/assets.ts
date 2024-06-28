import { MultichainNetworks } from './networks';

export const MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 = {
  BTC: `${MultichainNetworks.BITCOIN}/slip44:0`,
} as const;

export enum MultichainNativeAssets {
  BITCOIN = `${MultichainNetworks.BITCOIN}/slip44:0`,
  BITCOIN_TESTNET = `${MultichainNetworks.BITCOIN_TESTNET}/slip44:0`,
}
