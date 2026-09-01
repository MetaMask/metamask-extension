import {
  DeFiPositionsController,
  DeFiPositionsControllerMessenger,
} from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';
import { DeFiPositionsControllerInitMessenger } from '../messengers/defi-positions';
import {
  DEFAULT_FEATURE_FLAG_VALUES,
  FeatureFlagNames,
} from '../../../../shared/lib/feature-flags';
import {
  DEFI_CONTROLLER_V2_FLAG,
  isDefiControllerV2Enabled,
  type DefiControllerV2FeatureFlag,
} from '../../../../shared/lib/defi-controller-v2/remote-feature-flag';
import {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';

export const DeFiPositionsControllerInit: MessengerClientInitFunction<
  DeFiPositionsController,
  DeFiPositionsControllerMessenger,
  DeFiPositionsControllerInitMessenger
> = ({ initMessenger, controllerMessenger, getMessengerClient }) => {
  const getPreferencesController = () =>
    getMessengerClient('PreferencesController');
  const getOnboardingController = () =>
    getMessengerClient('OnboardingController');

  const messengerClient = new DeFiPositionsController({
    messenger: controllerMessenger,
    isEnabled: () => {
      const {
        state: { useExternalServices },
      } = getPreferencesController();
      const {
        state: { completedOnboarding },
      } = getOnboardingController();

      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      const assetsDefiPositionsEnabled = Boolean(
        remoteFeatureFlags?.[FeatureFlagNames.AssetsDefiPositionsEnabled] ??
        DEFAULT_FEATURE_FLAG_VALUES[
          FeatureFlagNames.AssetsDefiPositionsEnabled
        ],
      );
      const defiControllerV2Enabled = isDefiControllerV2Enabled(
        remoteFeatureFlags?.[DEFI_CONTROLLER_V2_FLAG] as
          | DefiControllerV2FeatureFlag
          | undefined,
      );

      // Legacy controller runs only when V2 is disabled.
      return (
        completedOnboarding &&
        useExternalServices &&
        assetsDefiPositionsEnabled &&
        !defiControllerV2Enabled
      );
    },
    trackEvent: (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => {
      trackEvent(
        createEventBuilder(payload.event)
          .addProperties({
            ...payload.properties,
            ...(payload.category === undefined
              ? {}
              : { category: payload.category }),
            ...(payload.revenue === undefined
              ? {}
              : { revenue: payload.revenue }),
            ...(payload.value === undefined ? {} : { value: payload.value }),
            ...(payload.currency === undefined
              ? {}
              : { currency: payload.currency }),
          })
          .addSensitiveProperties(payload.sensitiveProperties)
          .build({
            environmentType: payload.environmentType,
            page: payload.page,
            referrer: payload.referrer,
            excludeMetaMetricsId: options?.excludeMetaMetricsId,
            matomoEvent: options?.matomoEvent,
          }),
        options,
      );
    },
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
