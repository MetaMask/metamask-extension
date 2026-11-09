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
 * Starts a Money account deposit from a route.
 *
 * The deposit confirmation needs a placeholder transaction that is created in
 * the background, so this page waits for the Money account and then starts the
 * deposit, and the confirmation replaces it, with closing it returning to the
 * Money home. Ineligible users, and deposits that fail to set up (already
 * reported with a toast), go to the wallet home.
 */
export function MoneyDepositPage() {
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

export default MoneyDepositPage;
