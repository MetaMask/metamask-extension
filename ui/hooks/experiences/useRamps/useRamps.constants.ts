import { Hex } from '@metamask/utils';
import { ChainId, CHAIN_IDS } from '../../../../shared/constants/network';

export const portfolioUrl = process.env.PORTFOLIO_URL;
export const buyPath = '/buy';
export const entryParam = 'metamaskEntry';
export const entryParamValue = 'ext_buy_button';

export const MANUALLY_ACTIVE_CHAIN_IDS: (Hex | ChainId)[] = [CHAIN_IDS.SEPOLIA];
