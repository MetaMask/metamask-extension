import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getEnsControllerInitMessenger,
  getEnsControllerMessenger,
} from './ens-controller-messenger';

describe('getEnsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const ensControllerMessenger = getEnsControllerMessenger(messenger);

    expect(ensControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getEnsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const ensControllerInitMessenger = getEnsControllerInitMessenger(messenger);

    expect(ensControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
