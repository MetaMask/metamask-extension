import { Messenger } from '@metamask/base-controller';
import { SignatureController } from '@metamask/signature-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSignatureControllerInitMessenger,
  getSignatureControllerMessenger,
  SignatureControllerInitMessenger,
  SignatureControllerMessenger,
} from '../messengers';
import { SignatureControllerInit } from './signature-controller-init';

jest.mock('@metamask/signature-controller', () => ({
  SignatureController: jest.fn().mockImplementation(() => ({
    hub: {
      on: jest.fn(),
    },
  })),
}));

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    SignatureControllerMessenger,
    SignatureControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSignatureControllerMessenger(baseMessenger),
    initMessenger: getSignatureControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('SignatureControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = SignatureControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(Object);
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
