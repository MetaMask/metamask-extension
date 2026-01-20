import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getMetaMetricsDataDeletionControllerMessenger } from './metametrics-data-deletion-controller-messenger';

describe('getMetaMetricsDataDeletionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const metaMetricsDataDeletionControllerMessenger =
      getMetaMetricsDataDeletionControllerMessenger(messenger);

    expect(metaMetricsDataDeletionControllerMessenger).toBeInstanceOf(
      Messenger,
    );
  });
});
