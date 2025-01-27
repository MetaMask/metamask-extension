import {
  PPOMController,
  PPOMControllerMessenger,
} from '@metamask/ppom-validator';
import { IndexedDBPPOMStorage } from '../../lib/ppom/indexed-db-backend';
import * as PPOMModule from '../../lib/ppom/ppom';
import { ControllerInitFunction } from '../types';
import { PPOMControllerInitMessenger } from '../messengers/ppom-controller-messenger';

export const PPOMControllerInit: ControllerInitFunction<
  PPOMController,
  PPOMControllerMessenger,
  PPOMControllerInitMessenger
> = (request) => {
  const {
    controllerMessenger,
    initMessenger,
    getController,
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
      ppomInit: () => PPOMModule.default(process.env.PPOM_URI),
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
