import type { Hex } from '@metamask/utils';
import type { NetworkClientId } from '@metamask/network-controller';
import { getRemoteFeatureFlagsWithManifestOverrides } from '../../../../shared/lib/ab-testing/ab-test-analytics';
import { AnalyticsEventBuilder } from './analytics-event-builder';
import type { AnalyticsEventBuilderMessenger } from './analytics-event-builder-messenger';

export type ConfigureAnalyticsEventBuilderOptions = {
  messenger: AnalyticsEventBuilderMessenger;
  version: string;
  environment: string;
};

function formatAppVersion(version: string, environment: string): string {
  return environment === 'production' ? version : `${version}-${environment}`;
}

function getCurrentChainId(
  messenger: AnalyticsEventBuilderMessenger,
  networkClientId?: NetworkClientId,
): Hex {
  const selectedNetworkClientId =
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    networkClientId ||
    messenger.call('NetworkController:getState').selectedNetworkClientId;

  const {
    configuration: { chainId },
  } = messenger.call(
    'NetworkController:getNetworkClientById',
    selectedNetworkClientId,
  );

  return chainId;
}

/**
 * Configure the shared {@link AnalyticsEventBuilder} singleton for the extension.
 *
 * Call once during background initialization so all direct
 * `AnalyticsController` callers receive the same event normalization.
 *
 * @param options - Configuration options.
 * @param options.messenger - Messenger with access to required controller state.
 * @param options.version - Extension version from build metadata.
 * @param options.environment - Extension environment from build metadata.
 */
export function configureAnalyticsEventBuilder({
  messenger,
  version,
  environment,
}: ConfigureAnalyticsEventBuilderOptions): void {
  const appVersion = formatAppVersion(version, environment);

  AnalyticsEventBuilder.configure({
    getExtensionContext: () => {
      const preferencesState = messenger.call('PreferencesController:getState');
      const locale = preferencesState.currentLocale.replace('_', '-');
      const metaMetricsState = messenger.call('MetaMetricsController:getState');

      const { isEvmSelected, selectedMultichainNetworkChainId } =
        messenger.call('MultichainNetworkController:getState');

      return {
        chainId: getCurrentChainId(messenger),
        locale,
        appVersion,
        marketingCampaignCookieId: metaMetricsState.marketingCampaignCookieId,
        dataCollectionForMarketing: metaMetricsState.dataCollectionForMarketing,
        isEvmSelected,
        selectedMultichainNetworkChainId,
      };
    },
    getRemoteFeatureFlags: () =>
      getRemoteFeatureFlagsWithManifestOverrides(
        messenger.call('RemoteFeatureFlagController:getState')
          ?.remoteFeatureFlags as Record<string, unknown> | undefined,
      ),
  });
}
