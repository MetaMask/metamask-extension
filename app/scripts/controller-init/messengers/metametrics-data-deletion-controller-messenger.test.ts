import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMetaMetricsDataDeletionControllerMessenger } from './metametrics-data-deletion-controller-messenger';

describe('getMetaMetricsDataDeletionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const metaMetricsDataDeletionControllerMessenger =
      getMetaMetricsDataDeletionControllerMessenger(messenger);

    expect(metaMetricsDataDeletionControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
