import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { Patch } from 'immer';

const controllerName = 'OcapKernelController';

export type ServiceContactEntry = {
  name: string;
  contactUrl: string;
};

export type OcapKernelControllerState = {
  serviceContacts: ServiceContactEntry[];
};

export type OcapKernelControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  OcapKernelControllerState
>;

export type OcapKernelControllerSetServiceContactsAction = {
  type: `${typeof controllerName}:setServiceContacts`;
  handler: OcapKernelController['setServiceContacts'];
};

export type OcapKernelControllerActions =
  | OcapKernelControllerGetStateAction
  | OcapKernelControllerSetServiceContactsAction;

export type OcapKernelControllerStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [OcapKernelControllerState, Patch[]];
};

export type OcapKernelControllerEvents = OcapKernelControllerStateChange;

export type OcapKernelControllerMessenger = Messenger<
  typeof controllerName,
  OcapKernelControllerActions,
  OcapKernelControllerEvents
>;

const stateMetadata: StateMetadata<OcapKernelControllerState> = {
  serviceContacts: {
    persist: false,
    includeInDebugSnapshot: false,
    includeInStateLogs: false,
    usedInUi: true,
  },
};

function getDefaultState(): OcapKernelControllerState {
  return {
    serviceContacts: [],
  };
}

export class OcapKernelController extends BaseController<
  typeof controllerName,
  OcapKernelControllerState,
  OcapKernelControllerMessenger
> {
  constructor({
    messenger,
    state,
  }: {
    messenger: OcapKernelControllerMessenger;
    state?: Partial<OcapKernelControllerState>;
  }) {
    super({
      messenger,
      metadata: stateMetadata,
      name: controllerName,
      state: { ...getDefaultState(), ...state },
    });

    this.messenger.registerActionHandler(
      `${controllerName}:setServiceContacts`,
      this.setServiceContacts.bind(this),
    );
  }

  setServiceContacts(contacts: ServiceContactEntry[]): void {
    this.update((state) => {
      state.serviceContacts = contacts;
    });
  }
}
