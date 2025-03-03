import type { MetaMaskSliceState } from '../../../ducks/metamask/metamask';
import { getPreferences } from '../../../selectors';

// export type RootState = {
//   metamask: {
//     useTransactionSimulations?: boolean;
//   };
// };

export const selectUseTransactionSimulations = (state: MetaMaskSliceState) =>
  state.metamask.useTransactionSimulations;

export function selectConfirmationAdvancedDetailsOpen(
  state: MetaMaskSliceState,
) {
  return Boolean(getPreferences(state).showConfirmationAdvancedDetails);
}
