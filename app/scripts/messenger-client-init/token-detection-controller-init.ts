import { TokenDetectionController } from '@metamask/assets-controllers';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import { MessengerClientInitFunction } from './types';
import {
  TokenDetectionControllerMessenger,
  TokenDetectionControllerInitMessenger,
} from './messengers';

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

  const messengerClient = new TokenDetectionController({
    messenger: controllerMessenger,
    disabled: false,
    getBalancesInSingleCall: (...args) =>
      initMessenger.call(
        'AssetsContractController:getBalancesInSingleCall',
        ...args,
      ),
    trackMetaMetricsEvent: (...args) =>
      initMessenger.call('MetaMetricsController:trackEvent', ...args),
    useTokenDetection: () => Boolean(getRetypedPrefState().useTokenDetection),
    useExternalServices: () =>
      Boolean(getRetypedPrefState().useExternalServices),
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};
