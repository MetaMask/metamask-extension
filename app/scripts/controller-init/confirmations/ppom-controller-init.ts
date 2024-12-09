import {
  PPOMController,
  PPOMControllerMessenger,
} from '@metamask/ppom-validator';
import { PreferencesController } from '@metamask/preferences-controller';
import { IndexedDBPPOMStorage } from '../../lib/ppom/indexed-db-backend';
import * as PPOMModule from '../../lib/ppom/ppom';
import {
  ControllerInit,
  ControllerInitRequest,
  ControllerName,
} from '../types';
import {
  getPPOMControllerInitMessenger,
  getPPOMControllerMessenger,
  PPOMControllerInitMessenger,
} from '../messengers/ppom-controller-messenger';

export class PPOMControllerInit extends ControllerInit<
  PPOMController,
  PPOMControllerMessenger,
  PPOMControllerInitMessenger
> {
  init(
    request: ControllerInitRequest<
      PPOMControllerMessenger,
      PPOMControllerInitMessenger
    >,
  ) {
    const {
      controllerMessenger,
      getController,
      getGlobalChainId,
      getProvider,
      initMessenger,
      persistedState,
    } = request;

    const preferencesController = () =>
      getController<PreferencesController>(
        ControllerName.PreferencesController,
      );

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
      onPreferencesChange: initMessenger.subscribe.bind(
        initMessenger,
        'PreferencesController:stateChange',
      ),
      cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
      blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
    });
  }

  getControllerMessengerCallback() {
    return getPPOMControllerMessenger;
  }

  getInitMessengerCallback() {
    return getPPOMControllerInitMessenger;
  }
}
