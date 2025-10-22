import { Messenger } from '@metamask/messenger';
import { getErrorReportingServiceMessenger } from './error-reporting-service-messenger';
import { getRootMessenger } from '.';

describe('getErrorReportingServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const errorReportingServiceMessenger =
      getErrorReportingServiceMessenger(messenger);

    expect(errorReportingServiceMessenger).toBeInstanceOf(Messenger);
  });
});
