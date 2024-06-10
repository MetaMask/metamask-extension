export type RootState = {
  metamask: {
    useTransactionSimulations?: boolean;
  };
};

export const getUseTransactionSimulations = (state: RootState) =>
  state.metamask.useTransactionSimulations;
