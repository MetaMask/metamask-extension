export type RootState = {
  metamask: {
    useTransactionSimulations?: boolean;
  };
};

export const selectUseTransactionSimulations = (state: RootState) =>
  state.metamask.useTransactionSimulations;
