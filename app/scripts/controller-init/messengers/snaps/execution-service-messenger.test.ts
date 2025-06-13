import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getExecutionServiceMessenger } from './execution-service-messenger';

describe('getExecutionServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const executionServiceMessenger = getExecutionServiceMessenger(messenger);

    expect(executionServiceMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
