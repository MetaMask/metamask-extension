import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  ApprovalAcceptedEvent,
  ApprovalRejectedEvent,
  ApprovalRequest,
} from '@metamask/approval-controller';
import { errorCodes } from '@metamask/rpc-errors';
import {
  BLOCKABLE_METHODS,
  BLOCKING_THRESHOLD_IN_MS,
  NUMBER_OF_REJECTIONS_THRESHOLD,
  REJECTION_THRESHOLD_IN_MS,
} from '../../../shared/constants/origin-throttling';

const controllerName = 'OriginThrottlingController';

export type OriginState = {
  rejections: number;
  lastRejection: number;
};

export type OriginThrottlingState = {
  throttledOrigins: {
    [key: string]: OriginState;
  };
};

export type OriginThrottlingControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  OriginThrottlingState
>;

export type OriginThrottlingControllerStateChangeEvent =
  ControllerStateChangeEvent<typeof controllerName, OriginThrottlingState>;

export type OriginThrottlingControllerActions =
  OriginThrottlingControllerGetStateAction;

export type OriginThrottlingControllerEvents =
  OriginThrottlingControllerStateChangeEvent;

export type AllowedActions = never;

export type AllowedEvents = ApprovalAcceptedEvent | ApprovalRejectedEvent;

export type OriginThrottlingControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  OriginThrottlingControllerActions | AllowedActions,
  OriginThrottlingControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

export type OriginThrottlingControllerOptions = {
  state?: Partial<OriginThrottlingState>;
  messenger: OriginThrottlingControllerMessenger;
};

const controllerMetadata = {
  throttledOrigins: {
    persist: true,
    anonymous: false,
  },
};

const getDefaultState = (): OriginThrottlingState => ({
  throttledOrigins: {},
});

type ErrorWithCode = {
  code?: number;
} & Error;

const isUserRejectedError = (error: ErrorWithCode) =>
  error && error.code === errorCodes.provider.userRejectedRequest;

export class OriginThrottlingController extends BaseController<
  typeof controllerName,
  OriginThrottlingState,
  OriginThrottlingControllerMessenger
> {
  constructor(opts: OriginThrottlingControllerOptions) {
    super({
      messenger: opts.messenger,
      name: controllerName,
      state: {
        ...getDefaultState(),
        ...opts.state,
      },
      metadata: controllerMetadata,
    });

    this.messagingSystem.subscribe(
      'ApprovalController:accepted',
      this.#onApprovalAccepted.bind(this),
    );

    this.messagingSystem.subscribe(
      'ApprovalController:rejected',
      this.#onApprovalRejected.bind(this),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #onApprovalAccepted({ approval }: { approval: ApprovalRequest<any> }) {
    const { type, origin } = approval;
    if (BLOCKABLE_METHODS.has(type)) {
      this.resetOriginThrottlingState(origin);
    }
  }

  #onApprovalRejected({
    approval,
    error,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    approval: ApprovalRequest<any>;
    error: Error;
  }) {
    const { origin, type } = approval;

    if (BLOCKABLE_METHODS.has(type) && isUserRejectedError(error)) {
      this.#onConfirmationRejectedByUser(origin);
    }
  }

  #onConfirmationRejectedByUser(origin: string): void {
    const currentState = this.state.throttledOrigins[origin] || {
      rejections: 0,
      lastRejection: 0,
    };
    const currentTime = Date.now();
    const isUnderThreshold =
      currentTime - currentState.lastRejection < REJECTION_THRESHOLD_IN_MS;
    const newRejections = isUnderThreshold ? currentState.rejections + 1 : 1;

    this.update((state) => {
      state.throttledOrigins[origin] = {
        rejections: newRejections,
        lastRejection: currentTime,
      };
    });
  }

  resetOriginThrottlingState(origin: string): void {
    this.update((state) => {
      delete state.throttledOrigins[origin];
    });
  }

  isOriginBlockedForConfirmations(origin: string): boolean {
    const originState = this.state.throttledOrigins[origin];
    if (!originState) {
      return false;
    }
    const currentTime = Date.now();
    const { rejections, lastRejection } = originState;
    const isWithinOneMinute =
      currentTime - lastRejection <= BLOCKING_THRESHOLD_IN_MS;

    return rejections >= NUMBER_OF_REJECTIONS_THRESHOLD && isWithinOneMinute;
  }
}
