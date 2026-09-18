import { useSelector } from 'react-redux';
import { getCompletedOnboarding } from '../../ducks/metamask/metamask';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import useMultiPolling from '../useMultiPolling';
import { deFiStartPolling, deFiStopPolling } from './defiPollingActions';

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
