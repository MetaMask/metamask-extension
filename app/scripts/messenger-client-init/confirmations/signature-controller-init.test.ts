import { SignatureController } from '@metamask/signature-controller';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSignatureControllerInitMessenger,
  getSignatureControllerMessenger,
  SignatureControllerInitMessenger,
  SignatureControllerMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { SignatureControllerInit } from './signature-controller-init';

jest.mock('@metamask/signature-controller', () => ({
  SignatureController: jest.fn().mockImplementation(() => ({
    hub: {
      on: jest.fn(),
    },
  })),
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    SignatureControllerMessenger,
    SignatureControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSignatureControllerMessenger(baseMessenger),
    initMessenger: getSignatureControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('SignatureControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = SignatureControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(Object);
  });

  it('passes the proper arguments to the controller', () => {
    SignatureControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SignatureController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      decodingApiUrl: process.env.DECODING_API_URL,
      isDecodeSignatureRequestEnabled: expect.any(Function),
      trace: expect.any(Function),
    });
  });
});
