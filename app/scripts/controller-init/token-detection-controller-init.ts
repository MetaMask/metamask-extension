import { TokenDetectionController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from './types';
import {
  TokenDetectionControllerMessenger,
  TokenDetectionControllerInitMessenger,
} from './messengers';

export const TokenDetectionControllerInit: ControllerInitFunction<
  TokenDetectionController,
  TokenDetectionControllerMessenger,
  TokenDetectionControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new TokenDetectionController({
    // @ts-expect-error: TODO: Investigate type mismatch.
    messenger: controllerMessenger,
    getBalancesInSingleCall: (...args) =>
      initMessenger.call(
        'AssetsContractController:getBalancesInSingleCall',
        ...args,
      ),
    trackMetaMetricsEvent: (...args) =>
      initMessenger.call('MetaMetricsController:trackEvent', ...args),
    useAccountsAPI: true,
    platform: 'extension',
    useTokenDetection: () =>
      initMessenger.call('PreferencesController:getState').useTokenDetection,
    useExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
