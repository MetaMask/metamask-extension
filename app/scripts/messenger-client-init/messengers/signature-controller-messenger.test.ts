import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getSignatureControllerMessenger,
  getSignatureControllerInitMessenger,
} from './signature-controller-messenger';

describe('getSignatureControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const signatureControllerMessenger =
      getSignatureControllerMessenger(messenger);

    expect(signatureControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getSignatureControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const signatureControllerInitMessenger =
      getSignatureControllerInitMessenger(messenger);

    expect(signatureControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
