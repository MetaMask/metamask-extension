import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getConnectivityControllerMessenger } from './connectivity-controller-messenger';

describe('getConnectivityControllerMessenger', () => {
  it('returns a messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getConnectivityControllerMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });
});
