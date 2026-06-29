import { XlmScope } from '@metamask/keyring-api';

export const CLASSIC_TRUSTLINE_CHAIN_IDS: string[] = [
  XlmScope.Pubnet,
  // TODO: Add Ripple/XRP when supported.
];

export const NATIVE_RESERVE_CHAIN_IDS: string[] = [
  XlmScope.Pubnet,
  // TODO: Add Ripple/XRP when supported.
];
