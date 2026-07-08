import { Wallet } from '@metamask/wallet';
import type {
  DefaultActions,
  DefaultEvents,
  WalletOptions,
} from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { ShowApprovalRequest } from '@metamask/approval-controller';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import type { AnalyticsControllerGetStateAction } from '@metamask/analytics-controller';
import { RootMessenger } from '../lib/messenger';
import type { PreferencesControllerStateChangeEvent } from '../controllers/preferences-controller';
import type { OnboardingControllerStateChangeEvent } from '../controllers/onboarding';
import { setupRemoteFeatureFlagToggle } from './remote-feature-flags';
import { getApprovalControllerInstanceOptions } from './instance-options/approval-controller';
import { getConnectivityControllerInstanceOptions } from './instance-options/connectivity-controller';
import { getKeyringControllerInstanceOptions } from './instance-options/keyring-controller';
import { getRemoteFeatureFlagControllerInstanceOptions } from './instance-options/remote-feature-flag-controller';
import { getStorageServiceInstanceOptions } from './instance-options/storage-service';
import {
  getNetworkControllerInstanceOptions,
  setupRpcEndpointMetrics,
} from './instance-options/network-controller';
import { rampsController, rampsService } from './ramps';
import { getRampsEnvironment } from './instance-options/ramps-environment';

// TODO: Remove this workaround once @metamask/wallet types are updated to include ramps instance options.
type WalletInstanceOptions = WalletOptions['instanceOptions'] & {
  rampsService?: {
    environment?: ReturnType<typeof getRampsEnvironment>;
    context: string;
    fetch: typeof fetch;
  };
  rampsController?: Record<string, never>;
};

/**
 * The root messenger `initializeWallet` expects: the wallet defaults plus the
 * extra actions/events the extension-side wiring reads (the metaMetrics id from
 * `AnalyticsController`, plus the preference and onboarding state-change events
 * the toggle subscribes to). The remote feature flag enable/disable/update
 * actions the toggle calls are already covered by `DefaultActions`.
 */
export type WalletInitMessenger = RootMessenger<
  DefaultActions | AnalyticsControllerGetStateAction,
  | DefaultEvents
  | PreferencesControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
>;

/**
 * Construct the `@metamask/wallet` `Wallet` for the extension. Each
 * controller's client-specific options live in its own builder under
 * `./instance-options/`.
 *
 * @param options - Options bag.
 * @param options.messenger - The extension's root messenger.
 * @param options.state - The persisted state, keyed per controller name.
 * @param options.encryptor - The extension's vault encryptor.
 * @param options.showApprovalRequest - Callback that surfaces a pending
 * approval request to the user.
 * @param options.connectivityAdapter - Adapter that observes the device's
 * network connectivity.
 * @param options.infuraProjectId - The Infura project ID.
 * @returns The constructed `Wallet`.
 */
export function initializeWallet({
  messenger,
  state,
  encryptor,
  infuraProjectId,
  showApprovalRequest,
  connectivityAdapter,
}: {
  messenger: WalletInitMessenger;
  state: Record<string, Record<string, Json>>;
  encryptor?: Encryptor;
  showApprovalRequest?: ShowApprovalRequest;
  connectivityAdapter: ConnectivityAdapter;
  infuraProjectId: string;
}) {
  const wallet = new Wallet({
    messenger,
    state,
    initializationConfigurations: [rampsService, rampsController],
    instanceOptions: {
      approvalController: getApprovalControllerInstanceOptions({
        showApprovalRequest,
      }),
      connectivityController: getConnectivityControllerInstanceOptions({
        connectivityAdapter,
      }),
      keyringController: getKeyringControllerInstanceOptions({
        messenger,
        encryptor,
      }),
      networkController: getNetworkControllerInstanceOptions(infuraProjectId),
      remoteFeatureFlagController:
        getRemoteFeatureFlagControllerInstanceOptions({ messenger, state }),
      storageService: getStorageServiceInstanceOptions(),
      rampsService: {
        environment: getRampsEnvironment(),
        context: 'extension',
        fetch: global.fetch.bind(global),
      },
      rampsController: {},
    } as WalletInstanceOptions,
  });

  // Keep the wallet-owned `RemoteFeatureFlagController` in sync with onboarding
  // and the external-services preference, seeded from the same persisted state
  // as the initial `disabled` value above. The controller is driven over the
  // shared messenger, so no instance reference is needed.
  setupRemoteFeatureFlagToggle({
    messenger,
    preferencesState: {
      useExternalServices:
        state.PreferencesController?.useExternalServices !== false,
    },
    onboardingState: {
      completedOnboarding:
        state.OnboardingController?.completedOnboarding === true,
    },
  });

  setupRpcEndpointMetrics(infuraProjectId, messenger);

  wallet.init().catch((error) => console.error(error));

  return wallet;
}
