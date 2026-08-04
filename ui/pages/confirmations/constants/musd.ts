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

/**
 * Chain targeted by the developer-only mUSD confirmation harness.
 *
 * This is a harness choice, **not** the product's chain: the real Money
 * Account is Monad-only (see `MUSD_MONEY_ACCOUNT_CHAIN_IDS`), while the
 * developer buttons build a plain ERC-20 mUSD transfer purely to exercise the
 * confirmation layout, and mUSD conversion is a Mainnet flow. Mainnet is kept
 * so a developer's existing mUSD test balance still funds the harness. The
 * real deposit flow will take its chain from the vault config, not from here.
 */
export const MUSD_DEVELOPER_HARNESS_CHAIN_ID = CHAIN_IDS.MAINNET;
