export type RootState = {
  metamask: {
    useTransactionSimulations?: boolean;
    preferences?: {
      showConfirmationAdvancedDetails?: boolean;
      dismissSmartAccountSuggestionEnabled?: boolean;
      smartAccountOptIn?: boolean;
    };
  };
};

export const selectUseTransactionSimulations = (state: RootState) =>
  state.metamask.useTransactionSimulations;

export function selectConfirmationAdvancedDetailsOpen(state: RootState) {
  const { metamask } = state;
  return Boolean(metamask.preferences?.showConfirmationAdvancedDetails);
}

export function getDismissSmartAccountSuggestionEnabled(state: RootState) {
  const { metamask } = state;
  return Boolean(metamask.preferences?.dismissSmartAccountSuggestionEnabled);
}

export function getUseSmartAccount(state: RootState) {
  const { metamask } = state;
  return Boolean(metamask.preferences?.smartAccountOptIn);
}
