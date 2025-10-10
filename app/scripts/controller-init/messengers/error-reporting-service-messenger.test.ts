import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getErrorReportingServiceMessenger } from './error-reporting-service-messenger';

describe('getErrorReportingServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const errorReportingServiceMessenger =
      getErrorReportingServiceMessenger(messenger);

    expect(errorReportingServiceMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
