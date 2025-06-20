import type { SignatureController } from '@metamask/signature-controller';
import type {
  OriginalRequest,
  TypedMessageParams,
} from '@metamask/message-manager';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { addTypedMessage } from './util';
import type { AddSignatureMessageRequest, SignatureParams } from './util';

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
    };

    const result = await addTypedMessage(request);
    expect(result).toBe(hashMock);
  });

  it('should call endTrace with correct parameters', async () => {
    const request: AddSignatureMessageRequest = {
      signatureParams: signatureParamsMock,
      signatureController: signatureControllerMock,
    };

    await addTypedMessage(request);

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
