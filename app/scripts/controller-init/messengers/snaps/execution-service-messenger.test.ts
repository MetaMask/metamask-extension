import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getExecutionServiceMessenger } from './execution-service-messenger';

describe('getExecutionServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const executionServiceMessenger = getExecutionServiceMessenger(messenger);

    expect(executionServiceMessenger).toBeInstanceOf(Messenger);
  });
});
