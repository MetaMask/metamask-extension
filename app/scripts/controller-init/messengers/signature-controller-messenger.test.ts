import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getSignatureControllerMessenger,
  getSignatureControllerInitMessenger,
} from './signature-controller-messenger';

describe('getSignatureControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const signatureControllerMessenger =
      getSignatureControllerMessenger(messenger);

    expect(signatureControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getSignatureControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const signatureControllerInitMessenger =
      getSignatureControllerInitMessenger(messenger);

    expect(signatureControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
