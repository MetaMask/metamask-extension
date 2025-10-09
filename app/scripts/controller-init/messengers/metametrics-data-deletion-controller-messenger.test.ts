import { Messenger } from '@metamask/messenger';
import { getMetaMetricsDataDeletionControllerMessenger } from './metametrics-data-deletion-controller-messenger';
import { getRootMessenger } from '.';

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
