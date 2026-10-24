// MMPay dApp PoC — deeplink route for /mmpay
// Supported URLs:
//   https://link.metamask.io/mmpay?type=perpsDeposit
//   https://link.metamask.io/mmpay?type=perpsDeposit&amount=10
//   https://link.metamask.io/mmpay?type=perpsWithdraw&amount=5
//
// The handler validates `type` and forwards only `type` + `amount` to the
// landing page at MMPAY_DAPP_ROUTE. Invalid type → throws → router shows 404.
// IMPORTANT: do NOT forward arbitrary query params (open-redirect surface).

import { Route, MMPAY_DAPP_ROUTE } from './route';

/**
 * Allowed MMPay transaction types for the deeplink.
 * Keep in sync with MmPayType in app/scripts/lib/mmpay-dapp/registry.ts.
 */
const MMPAY_DEEPLINK_TYPES = ['perpsDeposit', 'perpsWithdraw'] as const;

/**
 * UI landing route for the MMPay dApp PoC deeplink.
 * Defined here as a constant; exported so T6 can import it when adding
 * the constant to ui/helpers/constants/routes.ts.
 * Will be updated to import from ui/helpers/constants/routes.ts in T6.
 */

export const mmpay = new Route({
  pathname: '/mmpay',
  getTitle: (_params: URLSearchParams) => 'deepLink_theMmPayPage',
  handler(params: URLSearchParams) {
    const type = params.get('type');
    if (
      !MMPAY_DEEPLINK_TYPES.includes(
        type as (typeof MMPAY_DEEPLINK_TYPES)[number],
      )
    ) {
      throw new Error(
        `Invalid type parameter: "${type}". Expected one of: ${MMPAY_DEEPLINK_TYPES.join(', ')}`,
      );
    }
    const query = new URLSearchParams({ type: type as string });
    const amount = params.get('amount');
    if (amount) {
      query.set('amount', amount);
    }
    return { path: MMPAY_DAPP_ROUTE, query };
  },
});
