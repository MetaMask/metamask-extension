import {
  SecretEscrowController,
  SecretEscrowControllerMessenger,
} from '@metamask/secret-escrow-controller';
import { MockSecretEscrowClient } from '@metamask/secret-escrow-client';
import { getRootMessenger } from '../lib/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { getSecretEscrowControllerMessenger } from './messengers/secret-escrow-controller-messenger';
import { SecretEscrowControllerInit } from './secret-escrow-controller-init';
import { MessengerClientInitRequest } from './types';

jest.mock('@metamask/secret-escrow-controller');
jest.mock('@metamask/secret-escrow-client');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SecretEscrowControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSecretEscrowControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('SecretEscrowControllerInit', () => {
  it('initializes the secret escrow controller with a mock client', () => {
    const requestMock = getInitRequestMock();

    const { messengerClient } = SecretEscrowControllerInit(requestMock);

    expect(messengerClient).toBeInstanceOf(SecretEscrowController);
    expect(jest.mocked(SecretEscrowController)).toHaveBeenCalledWith({
      state: undefined,
      messenger: expect.any(Object),
      client: expect.any(MockSecretEscrowClient),
    });
  });
});
