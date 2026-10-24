import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { ARBITRUM_USDC_ADDRESS, USDC_DECIMALS } from '../constants';
import { encodeErc20Transfer } from '../encode';
import type { MmPayDefinition } from '../types';

type MaybePerpsWithdrawFlag = {
  enabled?: boolean;
};

type RawPayPostQuoteFlag = {
  default?: { enabled?: boolean };
  overrides?: { perpsWithdraw?: MaybePerpsWithdrawFlag };
  perpsWithdraw?: MaybePerpsWithdrawFlag;
};

/**
 * Perps withdraw MMPay definition.
 *
 * Mirrors `ui/components/app/perps/hooks/createPerpsWithdrawTransaction.ts`:
 * the staged transaction is a USDC `transfer` from the user to themselves on
 * Arbitrum, which the confirmation UI replaces with the real Hyperliquid
 * signed-action payload once the user picks an amount.
 *
 * Availability mirrors the UI's `selectPayQuoteConfig('perpsWithdraw')` path:
 * `confirmations_pay_post_quote.overrides.perpsWithdraw.enabled`, falling
 * back to the direct `perpsWithdraw.enabled` key for mobile-compatible shapes.
 */
export const perpsWithdrawDefinition: MmPayDefinition = {
  type: 'perpsWithdraw',
  chainId: CHAIN_IDS.ARBITRUM,
  tokenDecimals: USDC_DECIMALS,
  isAvailable(remoteFeatureFlags) {
    /* eslint-disable @typescript-eslint/naming-convention */
    const flag = (
      remoteFeatureFlags as unknown as {
        confirmations_pay_post_quote?: RawPayPostQuoteFlag;
      }
    ).confirmations_pay_post_quote;
    /* eslint-enable @typescript-eslint/naming-convention */

    const override = flag?.overrides?.perpsWithdraw ?? flag?.perpsWithdraw;
    return override?.enabled === true;
  },
  build({ from, amountRaw }) {
    return {
      txParams: {
        from,
        to: ARBITRUM_USDC_ADDRESS,
        value: '0x0' as Hex,
        data: encodeErc20Transfer(from, amountRaw),
      },
      type: TransactionType.perpsWithdraw,
      chainId: CHAIN_IDS.ARBITRUM,
    };
  },
};
