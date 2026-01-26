import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';

export const MUSD_CURRENCY = 'MUSD';

export const MAINNET_MUSD = {
  address: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA' as Hex,
  decimals: 6,
  name: 'MUSD',
  symbol: 'MUSD',
  chainId: CHAIN_IDS.MAINNET,
};
