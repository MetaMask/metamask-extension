import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getErrorReportingServiceMessenger } from './error-reporting-service-messenger';

describe('getErrorReportingServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const errorReportingServiceMessenger =
      getErrorReportingServiceMessenger(messenger);

    expect(errorReportingServiceMessenger).toBeInstanceOf(Messenger);
  });
});
