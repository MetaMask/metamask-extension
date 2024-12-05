import { PPOMController } from '@metamask/ppom-validator';
import { PreferencesController } from '@metamask/preferences-controller';
import { IndexedDBPPOMStorage } from '../../lib/ppom/indexed-db-backend';
import * as PPOMModule from '../../lib/ppom/ppom';
import {
  ControllerInit,
  ControllerInitRequest,
  ControllerName,
} from '../types';
import {
  getPPOMControllerMessenger,
  PPOMControllerInitMessenger,
} from '../messengers/ppom-controller-messenger';

export class PPOMControllerInit extends ControllerInit<
  PPOMController,
  PPOMControllerInitMessenger
> {
  init(request: ControllerInitRequest<PPOMControllerInitMessenger>) {
    const {
      getController,
      getGlobalChainId,
      getMessenger,
      getProvider,
      persistedState,
    } = request;

    const preferencesController = () =>
      getController<PreferencesController>(
        ControllerName.PreferencesController,
      );

    const controllerMessenger = getMessenger();

    return new PPOMController({
      messenger: controllerMessenger,
      storageBackend: new IndexedDBPPOMStorage('PPOMDB', 1),
      provider: getProvider(),
      ppomProvider: {
        // @ts-expect-error Mismatched types
        PPOM: PPOMModule.PPOM,
        ppomInit: () => PPOMModule.default(process.env.PPOM_URI),
      },
      state: persistedState.PPOMController as PPOMController['state'],
      chainId: getGlobalChainId(),
      securityAlertsEnabled:
        preferencesController().state.securityAlertsEnabled,
      // @ts-expect-error Mismatched types
      onPreferencesChange: controllerMessenger.subscribe.bind(
        controllerMessenger,
        'PreferencesController:stateChange',
      ),
      cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
      blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
    });
  }

  getMessengerCallback() {
    return getPPOMControllerMessenger;
  }
}
