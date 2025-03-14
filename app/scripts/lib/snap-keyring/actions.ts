import MetaMetricsController from '../../controllers/metametrics-controller';

/**
 * MetaMask actions for the Snap keyring implementation.
 */
export type SnapKeyringActions = {
  trackEvent: MetaMetricsController['trackEvent'];
  persistAccountsState: () => Promise<void>;
  removeAccount: (address: string) => Promise<void>;
};
