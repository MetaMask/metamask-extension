import { useSelector } from 'react-redux';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';
import { submitRequestToBackground } from '../store/background-connection';
import { addPollingTokenToAppState, removePollingTokenFromAppState } from '../store/actions';


/**
 * Informs the DeFiPositionsController that the UI requires defi positions polling
 *
 * @returns polling token that can be used to stop polling.
 */
async function deFiStartPolling(): Promise<string> {
  const pollingToken = await submitRequestToBackground<string>('deFiStartPolling', [
    null,
  ]);

  await addPollingTokenToAppState(pollingToken);
  return pollingToken;
}

/**
 * Informs the DeFiPositionsController that the UI no longer needs defi positions polling
 *
 * @param pollingToken - Poll token received from calling deFiStartPolling
 */
async function deFiStopPolling(pollingToken: string) {
  await submitRequestToBackground('deFiStopPolling', [pollingToken]);
  await removePollingTokenFromAppState(pollingToken);
}

const useDeFiPolling = () => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const enabled = completedOnboarding && isUnlocked;

  useMultiPolling({
    startPolling: deFiStartPolling,
    stopPollingByPollingToken: deFiStopPolling,
    input: enabled ? [null] : [],
  });

  return {};
};

export default useDeFiPolling;
