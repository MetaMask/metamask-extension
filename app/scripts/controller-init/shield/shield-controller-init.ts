import {
  ShieldController,
  ShieldControllerMessenger,
  ShieldRemoteBackend,
} from '@metamask/shield-controller';
import { ControllerInitFunction } from '../types';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../../shared/modules/environment';
import { ShieldControllerInitMessenger } from '../messengers/shield/shield-controller-messenger';

export const ShieldControllerInit: ControllerInitFunction<
  ShieldController,
  ShieldControllerMessenger,
  ShieldControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;

  const baseUrl = process.env.SHIELD_RULE_ENGINE_URL;
  if (!baseUrl) {
    throw new Error('SHIELD_RULE_ENGINE_URL is not set');
  }

  const getAccessToken = () =>
    initMessenger.call('AuthenticationController:getBearerToken');

  const controller = new ShieldController({
    messenger: controllerMessenger,
    state: persistedState.ShieldController,
    backend: new ShieldRemoteBackend({
      getAccessToken,
      fetch,
      baseUrl,
    }),
  });

  if (getIsMetaMaskShieldFeatureEnabled()) {
    controller.start();
  }

  return {
    controller,
  };
};
