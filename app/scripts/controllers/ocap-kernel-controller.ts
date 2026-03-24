import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { Patch } from 'immer';

const controllerName = 'OcapKernelController';

export type OcapKernelControllerState = {
  capabilityVendorUrl: string | null;
};

export type OcapKernelControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  OcapKernelControllerState
>;

export type OcapKernelControllerSetCapabilityVendorUrlAction = {
  type: `${typeof controllerName}:setCapabilityVendorUrl`;
  handler: OcapKernelController['setCapabilityVendorUrl'];
};

export type OcapKernelControllerActions =
  | OcapKernelControllerGetStateAction
  | OcapKernelControllerSetCapabilityVendorUrlAction;

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
  capabilityVendorUrl: {
    persist: false,
    anonymous: true,
    includeInStateLogs: false,
    usedInUi: true,
  },
};

function getDefaultState(): OcapKernelControllerState {
  return {
    capabilityVendorUrl: null,
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
      `${controllerName}:setCapabilityVendorUrl`,
      this.setCapabilityVendorUrl.bind(this),
    );
  }

  setCapabilityVendorUrl(url: string): void {
    this.update((state) => {
      state.capabilityVendorUrl = url;
    });
  }
}
