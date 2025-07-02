import { useSelector } from 'react-redux';
import { deFiStartPolling, deFiStopPolling } from '../store/actions';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useDeFiPolling = () => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const enabled = completedOnboarding;

  useMultiPolling({
    startPolling: deFiStartPolling,
    stopPollingByPollingToken: deFiStopPolling,
    input: enabled ? [null] : [],
  });

  return {};
};

export default useDeFiPolling;
