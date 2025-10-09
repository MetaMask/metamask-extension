import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/metametrics-controller';
import { getMetaMetricsControllerMessenger } from './metametrics-controller-messenger';
import { getRootMessenger } from '.';

describe('getMetaMetricsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<AllowedActions, AllowedEvents>();
    const metaMetricsControllerMessenger =
      getMetaMetricsControllerMessenger(messenger);

    expect(metaMetricsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
