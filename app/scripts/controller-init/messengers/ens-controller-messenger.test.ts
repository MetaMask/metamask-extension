import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getEnsControllerInitMessenger,
  getEnsControllerMessenger,
} from './ens-controller-messenger';

describe('getEnsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const ensControllerMessenger = getEnsControllerMessenger(messenger);

    expect(ensControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getEnsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const ensControllerInitMessenger = getEnsControllerInitMessenger(messenger);

    expect(ensControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
