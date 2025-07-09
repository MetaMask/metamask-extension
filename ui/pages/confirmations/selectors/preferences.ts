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

export function getDismissSmartAccountSuggestionEnabled(state: RootState) {
  return Boolean(getPreferences(state).dismissSmartAccountSuggestionEnabled);
}

export function getUseSmartAccount(state: RootState) {
  return Boolean(getPreferences(state).smartAccountOptIn);
}

export function getSmartAccountOptInForAccounts(state: RootState) {
  return getPreferences(state).smartAccountOptInForAccounts;
}
