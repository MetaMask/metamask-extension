import type { SignatureController } from '@metamask/signature-controller';
import type {
  OriginalRequest,
  TypedMessageParams,
} from '@metamask/message-manager';
import { addSignatureMessage } from './util';
import type {
  AddSignatureMessageRequest,
  MessageType,
  SignatureParams,
} from './util';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { endTrace, TraceName } from '../../../../shared/lib/trace';

jest.mock('../../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../../shared/lib/trace'),
  endTrace: jest.fn(),
}));

describe('addSignatureMessage', () => {
  const idMock = 1234;
  const hashMock = 'hash-mock';
  const messageParamsMock = {
    from: '0x12345',
  } as TypedMessageParams;

  const originalRequestMock = {
    id: idMock,
  } as OriginalRequest;

  const signatureParamsMock: SignatureParams = [
    messageParamsMock,
    originalRequestMock,
  ];
  const signatureControllerMock: SignatureController = {
    newUnsignedTypedMessage: jest.fn(() => hashMock),
    newUnsignedPersonalMessage: jest.fn(() => hashMock),
  } as unknown as SignatureController;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a hash when called with valid parameters', async () => {
    const request: AddSignatureMessageRequest = {
      signatureParams: signatureParamsMock,
      signatureController: signatureControllerMock,
      type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA as MessageType,
    };

    const result = await addSignatureMessage(request);
    expect(result).toBe(hashMock);
  });

  it('should throw an error when called with invalid type', async () => {
    const request: AddSignatureMessageRequest = {
      signatureParams: signatureParamsMock,
      signatureController: signatureControllerMock,
      type: 'invalid-type' as MessageType,
    };

    await expect(addSignatureMessage(request)).rejects.toThrowError(
      'signatureController[functionName] is not a function',
    );
  });

  it('should call endTrace with correct parameters', async () => {
    const request: AddSignatureMessageRequest = {
      signatureParams: signatureParamsMock,
      signatureController: signatureControllerMock,
      type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA as MessageType,
    };

    await addSignatureMessage(request);

    expect(endTrace).toHaveBeenCalledTimes(2);
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.Middleware,
      id: idMock.toString(),
    });
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.Signature,
      id: idMock.toString(),
    });
  });
});
