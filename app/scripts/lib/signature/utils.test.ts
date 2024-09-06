import type {
  OriginalRequest,
  TypedMessageParams,
} from '@metamask/message-manager';
import { addTypedMessage } from './util';
import type { AddTypedMessageRequest, SignatureParams } from './util';
import { endTrace, TraceName } from '../../../../shared/lib/trace';

jest.mock('../../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../../shared/lib/trace'),
  endTrace: jest.fn(),
}));

describe('addTypedMessage', () => {
  const messageParamsMock = {
    from: '0x12345',
  } as TypedMessageParams;

  const originalRequestMock = {
    id: 1234,
  } as OriginalRequest;

  const signatureParams: SignatureParams = [
    messageParamsMock,
    originalRequestMock,
  ];

  const newUnsignedTypedMessageMock = jest.fn(() =>
    Promise.resolve('mock-hash'),
  );

  const request: AddTypedMessageRequest = {
    signatureParams,
    newUnsignedTypedMessage: newUnsignedTypedMessageMock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls newUnsignedTypedMessage with correct arguments', async () => {
    await addTypedMessage(request);
    expect(newUnsignedTypedMessageMock).toHaveBeenCalledTimes(1);
    expect(newUnsignedTypedMessageMock).toHaveBeenCalledWith(
      messageParamsMock,
      originalRequestMock,
    );
  });

  it('calls endTrace with correct arguments', async () => {
    await addTypedMessage(request);
    expect(endTrace).toHaveBeenCalledTimes(2);
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.Middleware,
      id: originalRequestMock?.id?.toString(),
    });
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.Signature,
      id: originalRequestMock?.id?.toString(),
    });
  });

  it('returns the hash from newUnsignedTypedMessage', async () => {
    const result = await addTypedMessage(request);
    expect(result).toBe('mock-hash');
  });
});
