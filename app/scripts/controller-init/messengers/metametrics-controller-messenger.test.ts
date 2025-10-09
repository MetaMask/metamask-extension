import { Messenger } from '@metamask/messenger';
import { getMetaMetricsControllerMessenger } from './metametrics-controller-messenger';
import { getRootMessenger } from '.';

describe('getMetaMetricsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const metaMetricsControllerMessenger =
      getMetaMetricsControllerMessenger(messenger);

    expect(metaMetricsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
