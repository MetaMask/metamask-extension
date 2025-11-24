import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/metametrics-controller';
import { getRootMessenger } from '../../lib/messenger';
import { getMetaMetricsControllerMessenger } from './metametrics-controller-messenger';

describe('getMetaMetricsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<AllowedActions, AllowedEvents>();
    const metaMetricsControllerMessenger =
      getMetaMetricsControllerMessenger(messenger);

    expect(metaMetricsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
