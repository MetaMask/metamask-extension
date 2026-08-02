import {
  SecretEscrowController,
  SecretEscrowControllerMessenger,
} from '@metamask/secret-escrow-controller';
import {
  HttpSecretEscrowClient,
  MockSecretEscrowClient,
} from '@metamask/secret-escrow-client';
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
  const originalEscrowUrl = process.env.SECRET_ESCROW_URL;

  afterEach(() => {
    if (originalEscrowUrl === undefined) {
      delete process.env.SECRET_ESCROW_URL;
    } else {
      process.env.SECRET_ESCROW_URL = originalEscrowUrl;
    }
  });

  it('initializes the secret escrow controller with a mock client by default', () => {
    delete process.env.SECRET_ESCROW_URL;
    const requestMock = getInitRequestMock();

    const { messengerClient } = SecretEscrowControllerInit(requestMock);

    expect(messengerClient).toBeInstanceOf(SecretEscrowController);
    expect(jest.mocked(SecretEscrowController)).toHaveBeenCalledWith({
      state: undefined,
      messenger: expect.any(Object),
      client: expect.any(MockSecretEscrowClient),
    });
  });

  it('uses the HTTP escrow client when SECRET_ESCROW_URL is set', () => {
    process.env.SECRET_ESCROW_URL = 'http://127.0.0.1:8787';
    const requestMock = getInitRequestMock();

    SecretEscrowControllerInit(requestMock);

    expect(jest.mocked(SecretEscrowController)).toHaveBeenCalledWith({
      state: undefined,
      messenger: expect.any(Object),
      client: expect.any(HttpSecretEscrowClient),
    });
  });
});
