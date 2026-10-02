import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type MessengerActions,
  type MessengerEvents,
  type MockAnyNamespace,
} from '@metamask/messenger';

import {
  MpcSigningMfaController,
  type MpcSigningMfaControllerMessenger,
} from './mpc-signing-mfa-controller';

function setupController(): MpcSigningMfaController {
  const messenger = new Messenger<
    MockAnyNamespace,
    MessengerActions<MpcSigningMfaControllerMessenger>,
    MessengerEvents<MpcSigningMfaControllerMessenger>
  >({ namespace: MOCK_ANY_NAMESPACE });
  const controllerMessenger: MpcSigningMfaControllerMessenger = new Messenger({
    namespace: 'MpcSigningMfaController',
    parent: messenger,
  });
  return new MpcSigningMfaController({ messenger: controllerMessenger });
}

describe('MpcSigningMfaController', () => {
  it('waits until the signing confirmation is accepted', async () => {
    const controller = setupController();
    const pending = controller.requestSigningConfirmation();

    expect(controller.state.pendingMpcSigningMfaRequestId).toEqual(
      expect.any(String),
    );

    controller.acceptSigningConfirmation();
    await expect(pending).resolves.toBeUndefined();
    expect(controller.state.pendingMpcSigningMfaRequestId).toBeNull();
  });

  it('rejects the signing confirmation when the user cancels', async () => {
    const controller = setupController();
    const pending = controller.requestSigningConfirmation();

    controller.rejectSigningConfirmation();
    await expect(pending).rejects.toThrow(
      'MFA signing confirmation was rejected',
    );
    expect(controller.state.pendingMpcSigningMfaRequestId).toBeNull();
  });

  it('rejects a second confirmation while one is waiting', async () => {
    const controller = setupController();
    const pending = controller.requestSigningConfirmation();

    await expect(controller.requestSigningConfirmation()).rejects.toThrow(
      'An MFA signing confirmation is already waiting',
    );

    controller.acceptSigningConfirmation();
    await pending;
  });
});
