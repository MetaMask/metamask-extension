import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { openMoneyFtue } from '../../ducks/money-ftue';
import { selectMoneyFtueSeen } from '../../selectors/money/persisted-state';
import { useDispatch } from '../../store/hooks';

export type UseOpenMoneyFtueOnFirstVisitOptions = {
  isAvailable: boolean;
  isLoading: boolean;
};

/**
 * Opens the Money account FTUE splash the first time a user reaches Money
 * home. Opens at most once per mount so a late persisted-state update cannot
 * reopen it.
 *
 * @param options - Availability and loading state from the Money gate.
 * @param options.isAvailable - Whether the Money account is available.
 * @param options.isLoading - Whether availability is still resolving.
 */
export function useOpenMoneyFtueOnFirstVisit({
  isAvailable,
  isLoading,
}: UseOpenMoneyFtueOnFirstVisitOptions): void {
  const dispatch = useDispatch();
  const hasSeenFtue = useSelector(selectMoneyFtueSeen);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAvailable || hasSeenFtue || hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;
    dispatch(openMoneyFtue({ source: 'moneyHome' }));
  }, [dispatch, hasSeenFtue, isAvailable, isLoading]);
}

export default useOpenMoneyFtueOnFirstVisit;
