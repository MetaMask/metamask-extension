/**
 * mUSD constants for the confirmations namespace.
 *
 * The token values are shared with mobile via `@metamask/money-account-utils`
 * and re-exported here so existing import paths keep working. Only
 * client-specific configuration stays local.
 */

import { CHAIN_IDS } from '../../../../shared/constants/chain-ids';

export const MUSD_CONVERSION_DEFAULT_CHAIN_ID = CHAIN_IDS.MAINNET;
