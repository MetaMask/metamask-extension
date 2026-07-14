import type { AnalyticsControllerGetStateAction } from '@metamask/analytics-controller';
import type { ShowApprovalRequest } from '@metamask/approval-controller';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import type { Encryptor } from '@metamask/keyring-controller';
import type { DefaultActions, DefaultEvents } from '@metamask/wallet';
import type { Json } from '@metamask/utils';
import type { TransactionMetricsRequest } from '../../../shared/types/metametrics';
import type { OnboardingControllerStateChangeEvent } from '../controllers/onboarding';
import type { PreferencesControllerStateChangeEvent } from '../controllers/preferences-controller';
import type { RootMessenger } from '../lib/messenger';
import type { MessengerClientFlatState } from '../messenger-client-init/controller-list';
import type {
  TransactionControllerInitMessengerActions,
  TransactionControllerInitMessengerEvents,
} from './messengers/transaction-controller-messenger';

/**
 * The root messenger `initializeWallet` expects: the wallet defaults plus the
 * extra actions/events the extension-side wiring reads (the metaMetrics id from
 * `AnalyticsController`, the remote feature flag toggle subscriptions, and the
 * TransactionController init messenger used by extension hooks/listeners).
 * The remote feature flag enable/disable/update actions the toggle calls are
 * already covered by `DefaultActions`.
 */
export type WalletInitMessenger = RootMessenger<
  | AnalyticsControllerGetStateAction
  | DefaultActions
  | TransactionControllerInitMessengerActions,
  | DefaultEvents
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | TransactionControllerInitMessengerEvents
>;

export type InitializeWalletRequest = {
  connectivityAdapter: ConnectivityAdapter;
  encryptor?: Encryptor;
  getFlatState: () => MessengerClientFlatState;
  getPermittedAccounts: (origin?: string) => string[] | Promise<string[]>;
  getTransactionMetricsRequest: () => TransactionMetricsRequest;
  infuraProjectId: string;
  initLangCode?: string;
  messenger: WalletInitMessenger;
  showApprovalRequest?: ShowApprovalRequest;
  state: Record<string, Record<string, Json>>;
};
