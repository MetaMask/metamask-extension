import { useSelector } from 'react-redux';
import { txDataSelector } from '../selectors';

/**
 * Returns the simulation failure warning if a simulaiton error
 * is present and user didn't acknowledge gas missing
 *
 * @param {boolean} userAcknowledgedGasMissing - Whether the user acknowledge gas missing
 * @returns {boolean} simulation failure warning
 */

export function useSimulationFailureWarning(userAcknowledgedGasMissing) {
  const txData = useSelector(txDataSelector) || {};
  const hasSimulationError = Boolean(txData.simulationFails);
  const renderSimulationFailureWarning =
    hasSimulationError && !userAcknowledgedGasMissing;
  return renderSimulationFailureWarning;
}
