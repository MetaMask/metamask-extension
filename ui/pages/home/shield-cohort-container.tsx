import { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { COHORT_NAMES } from '@metamask/subscription-controller';
import { useShieldSubscriptionContext } from '../../contexts/shield/shield-subscription';
import { getPendingShieldCohort } from '../../selectors';
import { setPendingShieldCohort } from '../../store/actions';
import type { MetaMaskReduxState } from '../../store/store';

/**
 * Ghost component that manages the Shield cohort eligibility evaluation.
 * Extracts the cohort-evaluation useEffect from the Home component so that
 * Shield-specific state no longer needs to be threaded through HomeProps.
 */
export const ShieldCohortContainer = memo(() => {
  const dispatch = useDispatch();
  const { evaluateCohortEligibility } = useShieldSubscriptionContext();

  const pendingShieldCohort = useSelector(getPendingShieldCohort);
  const isSignedIn = useSelector(
    (state: MetaMaskReduxState) => state.metamask.isSignedIn,
  );

  // Seed the pending cohort on mount when it has not been set yet.
  useEffect(() => {
    if (!pendingShieldCohort) {
      dispatch(setPendingShieldCohort(COHORT_NAMES.WALLET_HOME));
    }
  }, [dispatch, pendingShieldCohort]);

  // Evaluate once the user is signed in. evaluateCohortEligibility dedupes
  // repeated calls for the same cohort within a session.
  useEffect(() => {
    if (!pendingShieldCohort || !isSignedIn) {
      return;
    }

    evaluateCohortEligibility(pendingShieldCohort);
  }, [pendingShieldCohort, evaluateCohortEligibility, isSignedIn]);

  return null;
});
