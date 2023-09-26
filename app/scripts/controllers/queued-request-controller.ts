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
type RequestQueue2 = Array<Promise<unknown>>;

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
  private currentRequest: Promise<unknown> = Promise.resolve();

  private count: number = 0;
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

  length() {
    return this.count;
  }

  async enqueueRequest(requestNext: (...arg: Array<unknown>) => Promise<unknown>) {
    console.log('Request being enqueued!!!');
    this.count += 1;
    this.messagingSystem.publish('QueuedRequestController:countChanged', this.count);
    await this.currentRequest;
    console.log('Running next Item in queue');
    this.currentRequest = requestNext();
    try {
      await this.currentRequest;
      console.log('finished queue item');
      this.count -= 1;
      this.messagingSystem.publish('QueuedRequestController:countChanged', this.count);
    } catch (e) {
      console.log('finished queue item');
      this.count -= 1;
      this.messagingSystem.publish('QueuedRequestController:countChanged', this.count);
      throw e;
    }
    // return this.currentRequest;
  }
}
