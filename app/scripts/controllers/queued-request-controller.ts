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

export type QueuedRequestControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  never,
  never,
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

  enqueueRequest(origin: Domain, requestNext: Promise<unknown>) {
    if (this.requestQueue[origin] === undefined) {
      this.requestQueue[origin] = [];
    }

    this.requestQueue[origin].push(requestNext);

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
