import type { Hex } from '@metamask/utils';
import { Asset } from '../../types/send';

export type TransactionPayAsset = Asset & {
  disabled?: boolean;
  disabledMessage?: string;
  isSelected?: boolean;
};

export type SetPayTokenRequest = {
  address: Hex;
  chainId: Hex;
};

export const NATIVE_TOKEN_ADDRESS =
  '0x0000000000000000000000000000000000000000' as Hex;
