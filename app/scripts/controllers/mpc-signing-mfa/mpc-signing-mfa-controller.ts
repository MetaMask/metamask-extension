import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';

const controllerName = 'MpcSigningMfaController';

export type MpcSigningMfaControllerState = {
  /**
   * Id of the signing confirmation the UI should show.
   * `null` when nothing is waiting.
   */
  pendingMpcSigningMfaRequestId: string | null;
};

export function getDefaultMpcSigningMfaControllerState(): MpcSigningMfaControllerState {
  return {
    pendingMpcSigningMfaRequestId: null,
  };
}

const controllerMetadata: StateMetadata<MpcSigningMfaControllerState> = {
  pendingMpcSigningMfaRequestId: {
    includeInDebugSnapshot: true,
    includeInStateLogs: false,
    persist: false,
    usedInUi: true,
  },
};

export type MpcSigningMfaControllerRequestSigningConfirmationAction = {
  type: `${typeof controllerName}:requestSigningConfirmation`;
  handler: MpcSigningMfaController['requestSigningConfirmation'];
};

export type MpcSigningMfaControllerAcceptSigningConfirmationAction = {
  type: `${typeof controllerName}:acceptSigningConfirmation`;
  handler: MpcSigningMfaController['acceptSigningConfirmation'];
};

export type MpcSigningMfaControllerRejectSigningConfirmationAction = {
  type: `${typeof controllerName}:rejectSigningConfirmation`;
  handler: MpcSigningMfaController['rejectSigningConfirmation'];
};

export type MpcSigningMfaControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  MpcSigningMfaControllerState
>;

export type MpcSigningMfaControllerActions =
  | MpcSigningMfaControllerGetStateAction
  | MpcSigningMfaControllerRequestSigningConfirmationAction
  | MpcSigningMfaControllerAcceptSigningConfirmationAction
  | MpcSigningMfaControllerRejectSigningConfirmationAction;

export type MpcSigningMfaControllerStateChangeEvent =
  ControllerStateChangeEvent<
    typeof controllerName,
    MpcSigningMfaControllerState
  >;

export type MpcSigningMfaControllerMessenger = Messenger<
  typeof controllerName,
  MpcSigningMfaControllerActions,
  MpcSigningMfaControllerStateChangeEvent
>;

type PendingConfirmation = {
  id: string;
  resolve: () => void;
  reject: (error: Error) => void;
};

/**
 * Shows a confirmation while the MPC keyring waits for a signing 2FA token.
 *
 * This is not an approval-controller request. A signature already has a
 * confirmation open, and a second approval would queue behind it, so the
 * keyring would wait for a screen the user cannot reach.
 */
export class MpcSigningMfaController extends BaseController<
  typeof controllerName,
  MpcSigningMfaControllerState,
  MpcSigningMfaControllerMessenger
> {
  #pending: PendingConfirmation | null = null;

  constructor({
    messenger,
    state = {},
  }: {
    messenger: MpcSigningMfaControllerMessenger;
    state?: Partial<MpcSigningMfaControllerState>;
  }) {
    super({
      messenger,
      metadata: controllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultMpcSigningMfaControllerState(),
        ...state,
      },
    });

    this.messenger.registerMethodActionHandlers(this, [
      'requestSigningConfirmation',
      'acceptSigningConfirmation',
      'rejectSigningConfirmation',
    ]);
  }

  /**
   * Block until the user confirms or cancels the signing MFA prompt.
   *
   * @returns Resolves when the user confirms.
   */
  async requestSigningConfirmation(): Promise<void> {
    if (this.#pending) {
      throw new Error('An MFA signing confirmation is already waiting');
    }

    const id = crypto.randomUUID();
    try {
      await new Promise<void>((resolve, reject) => {
        this.#pending = { id, resolve, reject };
        this.update((draft) => {
          draft.pendingMpcSigningMfaRequestId = id;
        });
      });
    } finally {
      this.#clearPending(id);
    }
  }

  /**
   * Drop the waiting request after it settles.
   *
   * A separate method keeps this read outside the control-flow narrowing of
   * `requestSigningConfirmation`, which has already proven `#pending` is null.
   *
   * @param id - The request that just finished.
   */
  #clearPending(id: string): void {
    if (this.#pending?.id !== id) {
      return;
    }

    this.#pending = null;
    this.update((draft) => {
      draft.pendingMpcSigningMfaRequestId = null;
    });
  }

  /**
   * Let the waiting signing request continue.
   */
  acceptSigningConfirmation(): void {
    this.#pending?.resolve();
  }

  /**
   * Cancel the waiting signing request.
   */
  rejectSigningConfirmation(): void {
    this.#pending?.reject(new Error('MFA signing confirmation was rejected'));
  }
}
