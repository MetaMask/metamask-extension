import { getPreferences } from '../../../selectors';
import { MetaMaskReduxState } from '../../../store/store';

// export type RootState = {
//   metamask: {
//     useTransactionSimulations?: boolean;
//   };
// };

export const selectUseTransactionSimulations = (state: MetaMaskReduxState) =>
  state.metamask.useTransactionSimulations;

export function selectConfirmationAdvancedDetailsOpen(
  state: MetaMaskReduxState,
) {
  return Boolean(getPreferences(state).showConfirmationAdvancedDetails);
}
