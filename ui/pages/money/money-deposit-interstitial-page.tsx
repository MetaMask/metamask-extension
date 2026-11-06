import React, { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoadingScreen from '../../components/ui/loading-screen';
import {
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
} from '../../helpers/constants/routes';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyAccountDeposit } from '../../hooks/money/useMoneyAccountDeposit';

/**
 * Loading page shown while a Money account deposit is being prepared.
 *
 * The deposit confirmation needs a placeholder transaction that is created in
 * the background. Once the Money account is available, the deposit starts and
 * the confirmation replaces this page, with closing it returning to the Money
 * home. Ineligible users, and deposits that fail to set up (already reported
 * with a toast), go to the wallet home.
 */
export function MoneyDepositInterstitialPage() {
  const navigate = useNavigate();
  const { availability, isLoading } = useMoneyAccountAvailability();
  const { initiateDeposit } = useMoneyAccountDeposit();
  const hasHandledRequest = useRef(false);

  useEffect(() => {
    if (hasHandledRequest.current || isLoading || !availability.isAvailable) {
      return;
    }

    hasHandledRequest.current = true;

    initiateDeposit({
      replaceConfirmation: true,
      goBackTo: MONEY_HOME_ROUTE,
    }).then((isStarted) => {
      if (!isStarted) {
        navigate(DEFAULT_ROUTE, { replace: true });
      }
    });
  }, [availability.isAvailable, initiateDeposit, isLoading, navigate]);

  if (!isLoading && !availability.isAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return <LoadingScreen />;
}

export default MoneyDepositInterstitialPage;
