import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getStaticAssetsServiceInitMessenger,
  getStaticAssetsServiceMessenger,
} from './static-assets-service-messenger';

describe('getStaticAssetsServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const controllerMessenger = getStaticAssetsServiceMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getStaticAssetsServiceInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const initMessenger = getStaticAssetsServiceInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(Messenger);
  });
});
