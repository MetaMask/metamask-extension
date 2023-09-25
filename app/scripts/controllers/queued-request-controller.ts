import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { ORIGIN_METAMASK } from '../../../shared/constants/app';

const controllerName = 'QueuedRequestController';

// should serialize and persist these values.
const stateMetadata = {
  queue: { persist: false, anonymous: false },
};

const getDefaultState = () => ({
  queue: {
    [ORIGIN_METAMASK]: [],
  },
});

type Domain = string;
type RequestQueue = Record<Domain, Promise<unknown>[]>;

type Request = any;

export type QueuedRequestControllerState = {
  queue: Record<Domain, Request>;
};

export type QueuedRequestControllerCountChangedEvent = {
  type: 'QueuedRequestController:countChanged';
  payload: [number];
};

export type QueuedRequestControllerEvents = QueuedRequestControllerCountChangedEvent;

export type QueuedRequestControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  never,
  QueuedRequestControllerEvents,
  never,
  never
>;

export type QueuedRequestControllerOptions = {
  messenger: QueuedRequestControllerMessenger;
};

/**
 * Controller for requesting encryption public key requests requiring user approval.
 */
export class QueuedRequestController extends BaseControllerV2<
  typeof controllerName,
  QueuedRequestControllerState,
  QueuedRequestControllerMessenger
> {
  private requestQueue: RequestQueue = {};

  /**
   * Construct a EncryptionPublicKey controller.
   *
   * @param options - The controller options.
   * @param options.messenger - The restricted controller messenger for the QueuedRequestController
   */
  constructor({ messenger }: QueuedRequestControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(),
    });
  }

  hasQueuedRequests(origin?: Domain) {
    if (origin) {
      return this.requestQueue[origin].length > 0;
    }
    return Object.keys(this.requestQueue).length > 0;
  }

  length(origin?: Domain) {
    if (origin) {
      return this.requestQueue[origin].length;
    }
    return Object.values(this.requestQueue).reduce((len, item) => item.length + len, 0);
  }

  enqueueRequest(origin: Domain, requestNext: Promise<unknown>) {
    console.log('Request being enqueued!!!');
    if (this.requestQueue[origin] === undefined) {
      this.requestQueue[origin] = [];
    }

    this.requestQueue[origin].push(requestNext);

    this.messagingSystem.publish('QueuedRequestController:countChanged', this.length());
    requestNext.finally(() => {
      const index = this.requestQueue[origin].findIndex((p) => p === requestNext);
      console.log('updating queue length from: ', this.length());
      this.requestQueue[origin][index] = this.requestQueue[origin][this.requestQueue[origin].length - 1];
      this.requestQueue[origin].pop();
      console.log(' to: ', this.length());
    });

    return this.requestQueue;
  }

  async waitForRequestQueue() {
    const domainQueues = Object.values(this.requestQueue).map((domainQueue) =>
      Promise.all(domainQueue),
    );
    await Promise.all(domainQueues);
    this.requestQueue = {};
    return true;
  }
}
