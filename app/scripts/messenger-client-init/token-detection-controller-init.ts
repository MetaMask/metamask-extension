import {
  TokenDetectionController,
  TokenDetectionControllerMessenger,
} from '@metamask/assets-controllers';
import type {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../shared/constants/metametrics';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import { createEventBuilder, trackEvent } from '../controllers/analytics';
import { MessengerClientInitFunction } from './types';
import { TokenDetectionControllerInitMessenger } from './messengers';
import { tokenListService } from './token-list-service';

export const TokenDetectionControllerInit: MessengerClientInitFunction<
  TokenDetectionController,
  TokenDetectionControllerMessenger,
  TokenDetectionControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  // Extension uses a custom PreferencesController that has custom state
  const getRetypedPrefState = () =>
    initMessenger.call(
      'PreferencesController:getState',
    ) as unknown as PreferencesControllerState;

  const trackMetaMetricsEvent = (
    payload: MetaMetricsEventPayload,
    options?: MetaMetricsEventOptions,
  ) => {
    trackEvent(
      createEventBuilder(payload.event)
        .addProperties({
          ...(payload.properties ?? {}),
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
    );
  };

  const messengerClient = new TokenDetectionController({
    messenger: controllerMessenger,
    disabled: false,
    getBalancesInSingleCall: (...args) =>
      initMessenger.call(
        'AssetsContractController:getBalancesInSingleCall',
        ...args,
      ),
    trackMetaMetricsEvent,
    useTokenDetection: () => Boolean(getRetypedPrefState().useTokenDetection),
    // Don't reach external services (token list API + balance multicall) until
    // onboarding is complete — otherwise detection triggered by the vault
    // unlock during onboarding leaks network calls before the user can opt out.
    // Mirrors the `completedOnboarding` gate on the token-balances and
    // account-tracker controllers.
    useExternalServices: () => {
      const { completedOnboarding } = initMessenger.call(
        'OnboardingController:getState',
      );
      return (
        completedOnboarding &&
        Boolean(getRetypedPrefState().useExternalServices)
      );
    },
    tokenListService,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};
