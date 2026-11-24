/**
 * Shared Stellar E2E constants (network ids, asset ids, display balances).
 * Mock/fixture helpers live in `common-stellar.ts`.
 */

import type { CaipAssetType } from '@metamask/utils';

export const STELLAR_NETWORK_NAME = 'Stellar';
export const STELLAR_CHAIN_ID = 'stellar:pubnet';
export const STELLAR_NATIVE_ASSET_ID =
  `${STELLAR_CHAIN_ID}/slip44:148` as CaipAssetType;

/** Circle USDC on Stellar pubnet (classic asset used across product tests). */
export const STELLAR_USDC_ISSUER =
  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
export const STELLAR_USDC_ASSET_ID =
  `${STELLAR_CHAIN_ID}/asset:USDC-${STELLAR_USDC_ISSUER}` as CaipAssetType;

/** EURC classic asset used as a second swap destination in Swap E2E. */
export const STELLAR_EURC_ISSUER =
  'GDHU6WRG4IEQXM5NZ4BMPKOXHWKG23DEZXLFYCAVTZJWN3VBFTEYHHD6';
export const STELLAR_EURC_ASSET_ID =
  `${STELLAR_CHAIN_ID}/asset:EURC-${STELLAR_EURC_ISSUER}` as CaipAssetType;

/** Internal bridge-controller chain id for Stellar pubnet. */
export const STELLAR_BRIDGE_CHAIN_ID = 20_000_000_000_002;

/** Funded mock balance: 100 XLM. */
export const XLM_BALANCE = '100.0000000';
export const XLM_TO_USD_RATE = 0.4;
/** Expected homepage native balance string for funded account. */
export const XLM_BALANCE_DISPLAY = '100 XLM';
/** Expected homepage fiat for funded account (100 * $0.4). */
export const XLM_FIAT_DISPLAY = '$40.00';

export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';
