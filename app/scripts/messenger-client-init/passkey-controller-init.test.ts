import {
  PasskeyController,
  PasskeyControllerMessenger,
} from '@metamask/passkey-controller';
import { getRootMessenger } from '../lib/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { getPasskeyControllerMessenger } from './messengers';
import { PasskeyControllerInit } from './passkey-controller-init';
import { MessengerClientInitRequest } from './types';

jest.mock('@metamask/passkey-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<PasskeyControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPasskeyControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('PasskeyControllerInit', () => {
  it('initializes the passkey controller with extension origin', () => {
    const requestMock = getInitRequestMock();
    requestMock.extension.runtime = {
      getURL: jest.fn().mockReturnValue('chrome-extension://mock-id/'),
    } as never;

    const { messengerClient } = PasskeyControllerInit(requestMock);

    expect(messengerClient).toBeInstanceOf(PasskeyController);
    expect(jest.mocked(PasskeyController)).toHaveBeenCalledWith({
      state: undefined,
      messenger: expect.any(Object),
      rpId: undefined,
      rpName: 'MetaMask',
      expectedRPID: 'chrome-extension://mock-id',
      expectedOrigin: 'chrome-extension://mock-id',
      userName: 'MetaMask Wallet',
      userDisplayName: 'MetaMask Wallet',
    });
  });

  it('uses empty expectedOrigin when extension runtime URL is unavailable', () => {
    const requestMock = getInitRequestMock();
    requestMock.extension.runtime = {} as never;

    PasskeyControllerInit(requestMock);

    expect(jest.mocked(PasskeyController)).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedOrigin: '',
      }),
    );
  });
});
