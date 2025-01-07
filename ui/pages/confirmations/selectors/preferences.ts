import { MetaMaskSliceControllerState } from '../../../ducks/metamask/metamask';
import { getPreferences } from '../../../selectors';

export const selectUseTransactionSimulations = (
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) => state.metamask.PreferencesController.useTransactionSimulations;

export function selectConfirmationAdvancedDetailsOpen(
  state: Parameters<typeof getPreferences>[0],
) {
  return Boolean(getPreferences(state).showConfirmationAdvancedDetails);
}
