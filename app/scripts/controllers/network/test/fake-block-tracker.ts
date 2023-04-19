import { PollingBlockTracker } from 'eth-block-tracker';

/**
 * Acts like a PollingBlockTracker, but doesn't start the polling loop or
 * make any requests.
 */
export class FakeBlockTracker extends PollingBlockTracker {
  async _start() {
    // do nothing
  }
}
