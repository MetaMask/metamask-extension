import type {
  PPOMControllerMessenger} from '@metamask/ppom-validator';
import {
  PPOMController
} from '@metamask/ppom-validator';

import { IndexedDBPPOMStorage } from '../../lib/ppom/indexed-db-backend';
import * as PPOMModule from '../../lib/ppom/ppom';
import type { PPOMControllerInitMessenger } from '../messengers/ppom-controller-messenger';
import type { ControllerInitFunction } from '../types';

export const PPOMControllerInit: ControllerInitFunction<
  PPOMController,
  // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
  PPOMControllerMessenger,
  PPOMControllerInitMessenger
> = (request) => {
  const {
    controllerMessenger,
    initMessenger,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31863
    getController,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31863
    getGlobalChainId,
    getProvider,
    persistedState,
  } = request;

  const preferencesController = () => getController('PreferencesController');

  const controller = new PPOMController({
    messenger: controllerMessenger,
    storageBackend: new IndexedDBPPOMStorage('PPOMDB', 1),
    provider: getProvider(),
    ppomProvider: {
      // @ts-expect-error Controller and PPOM wrapper have different argument types in `new` and `validateJsonRpc`
      PPOM: PPOMModule.PPOM,
      ppomInit: async () => PPOMModule.default(process.env.PPOM_URI),
    },
    // @ts-expect-error State type is not `Partial` in controller.
    state: persistedState.PPOMController,
    chainId: getGlobalChainId(),
    securityAlertsEnabled: preferencesController().state.securityAlertsEnabled,
    // @ts-expect-error `onPreferencesChange` type signature is incorrect in `PPOMController`
    onPreferencesChange: initMessenger.subscribe.bind(
      initMessenger,
      'PreferencesController:stateChange',
    ),
    // Both values have defaults in `builds.yml` so should always be defined.
    cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
    blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
  });

  return {
    controller,
  };
};
