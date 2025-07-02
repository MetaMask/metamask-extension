import { useSelector } from 'react-redux';
import { deFiStartPolling, deFiStopPolling } from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

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
