import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMetaMetricsControllerMessenger } from './metametrics-controller-messenger';

describe('getMetaMetricsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const metaMetricsControllerMessenger =
      getMetaMetricsControllerMessenger(messenger);

    expect(metaMetricsControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
