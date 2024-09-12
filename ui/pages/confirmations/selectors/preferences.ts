import { getPreferences } from '../../../selectors';

export type RootState = {
  metamask: {
    useTransactionSimulations?: boolean;
  };
};

export const selectUseTransactionSimulations = (state: RootState) =>
  state.metamask.useTransactionSimulations;

export function selectConfirmationAdvancedDetailsOpen(state: RootState) {
  return Boolean(getPreferences(state).showConfirmationAdvancedDetails);
}
