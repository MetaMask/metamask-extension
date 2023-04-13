import { PollingBlockTracker } from 'eth-block-tracker';

/**
 * Implements just enough of the block tracker interface to pass the tests but
 * nothing more.
 */
export class FakeBlockTracker extends PollingBlockTracker {
  public eventNames() {
    return [];
  }
}
