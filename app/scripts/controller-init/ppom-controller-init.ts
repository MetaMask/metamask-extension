import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { PPOMController } from '@metamask/ppom-validator';
import {
  PreferencesController,
  PreferencesControllerStateChangeEvent,
} from '@metamask/preferences-controller';
import { IndexedDBPPOMStorage } from '../lib/ppom/indexed-db-backend';
import * as PPOMModule from '../lib/ppom/ppom';
import { ControllerInit, ControllerInitRequest, ControllerName } from './types';

type MessengerActions = NetworkControllerGetNetworkClientByIdAction;

type MessengerEvents =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent
  | PreferencesControllerStateChangeEvent;

export class PPOMControllerInit extends ControllerInit<
  PPOMController,
  MessengerActions,
  MessengerEvents
> {
  public init(
    request: ControllerInitRequest<MessengerActions, MessengerEvents>,
  ) {
    const {
      controllerMessenger,
      getController,
      getGlobalChainId,
      getProvider,
      persistedState,
    } = request;

    const messenger = controllerMessenger.getRestricted({
      name: 'PPOMController',
      allowedEvents: [
        'NetworkController:stateChange',
        'NetworkController:networkDidChange',
      ],
      allowedActions: ['NetworkController:getNetworkClientById'],
    });

    const preferencesController = () =>
      getController<PreferencesController>(
        ControllerName.PreferencesController,
      );

    return new PPOMController({
      messenger,
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

  override getMemStateKey(_controller: PPOMController): string | undefined {
    return undefined;
  }
}
