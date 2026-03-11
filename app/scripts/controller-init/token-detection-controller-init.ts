import {
  TokenDetectionController,
  type TokenDetectionControllerMessenger as PackageTokenDetectionControllerMessenger,
} from '@metamask/assets-controllers';
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
    // @ts-expect-error - TokenBalancesControllerMessenger type is incorrect - to investigate
    messenger:
      controllerMessenger as unknown as PackageTokenDetectionControllerMessenger,
    disabled: false,
    getBalancesInSingleCall: (...args) =>
      initMessenger.call(
        'AssetsContractController:getBalancesInSingleCall',
        ...args,
      ),
    trackMetaMetricsEvent: (...args) =>
      initMessenger.call('MetaMetricsController:trackEvent', ...args),
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
