import { submitRequestToBackground } from '../background-connection';

type refreshPooledStakingEligibilityOptions = {
  address?: string;
};

export async function refreshPooledStakingEligibility({
  address,
}: refreshPooledStakingEligibilityOptions = {}) {
  return await submitRequestToBackground<void>('refreshStakingEligibility', [
    { address },
  ]);
}
