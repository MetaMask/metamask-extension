/**
 * mUSD constants for the confirmations namespace.
 *
 * The token values are shared with mobile via `@metamask/money-account-utils`
 * and re-exported here so existing import paths keep working. Only
 * client-specific configuration stays local.
 */

import { CHAIN_IDS } from '../../../../shared/constants/network';

export {
  MUSD_TOKEN,
  MUSD_DECIMALS,
  MUSD_TOKEN_ADDRESS,
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  MUSD_TOKEN_ASSET_ID_BY_CHAIN,
  MUSD_CURRENCY,
  MUSD_MONEY_ACCOUNT_CHAIN_IDS,
  getTokenDisplaySymbol,
  isMusdToken,
  isMusdTokenOnChain,
  isMusdOnMoneyAccountChain,
} from '@metamask/money-account-utils';

export const MUSD_CONVERSION_DEFAULT_CHAIN_ID = CHAIN_IDS.MAINNET;
