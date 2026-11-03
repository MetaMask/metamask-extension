import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MONEY_DEPOSIT_DEEPLINK_PARAM } from '../../../shared/lib/deep-links/routes/money-account-deposit';

type UseMoneyDepositDeeplinkOptions = {
  /**
   * Whether the Money account is available and ready for a deposit.
   */
  isReady: boolean;
  initiateDeposit: () => unknown;
};

/**
 * Starts a Money Account deposit once when the page was opened by the
 * `money-account-deposit` deeplink.
 *
 * The deeplink param is removed from the URL before the deposit starts, so
 * the confirmation's `goBackTo` (captured from the current location) returns
 * to a clean Money home rather than one that would start another deposit.
 *
 * @param options - Hook options.
 * @param options.isReady - Whether the Money account is ready for a deposit.
 * @param options.initiateDeposit - Starts the deposit flow.
 */
export function useMoneyDepositDeeplink({
  isReady,
  initiateDeposit,
}: UseMoneyDepositDeeplinkOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDepositPendingRef = useRef(false);
  const hasDepositParam =
    searchParams.get(MONEY_DEPOSIT_DEEPLINK_PARAM) === 'true';

  useEffect(() => {
    if (!isReady || !hasDepositParam) {
      return;
    }

    setSearchParams(
      (params) => {
        const nextParams = new URLSearchParams(params);
        nextParams.delete(MONEY_DEPOSIT_DEEPLINK_PARAM);
        return nextParams;
      },
      { replace: true },
    );
    isDepositPendingRef.current = true;
  }, [hasDepositParam, isReady, setSearchParams]);

  useEffect(() => {
    if (!isDepositPendingRef.current || hasDepositParam) {
      return;
    }

    isDepositPendingRef.current = false;
    initiateDeposit();
  }, [hasDepositParam, initiateDeposit]);
}
