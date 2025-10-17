import {
  ShieldController,
  ShieldControllerMessenger,
  ShieldRemoteBackend,
} from '@metamask/shield-controller';
import { ControllerInitFunction } from '../types';
import { ShieldControllerInitMessenger } from '../messengers/shield/shield-controller-messenger';

export const ShieldControllerInit: ControllerInitFunction<
  ShieldController,
  ShieldControllerMessenger,
  ShieldControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;

  const baseUrl =
    process.env.SHIELD_RULE_ENGINE_URL ??
    'https://shield-rule-engine.dev-api.cx.metamask.io';

  const getAccessToken = () =>
    initMessenger.call('AuthenticationController:getBearerToken');

  const controller = new ShieldController({
    messenger: controllerMessenger,
    state: persistedState.ShieldController,
    backend: new ShieldRemoteBackend({
      getAccessToken,
      fetch: (input, init) => {
        // From https://github.com/MetaMask/metamask-extension/pull/35588/
        // Without wrapping fetch, the requests are not sent as expected. More
        // investigation is needed.
        return fetch(input, init);
      },
      baseUrl,
    }),
  });

  return {
    controller,
  };
};
