import type {
  MessageParamsTyped,
  MessageParamsPersonal,
  SignatureController,
} from '@metamask/signature-controller';
import {
  JsonRpcRequest,
  MiddlewareContext,
} from '@metamask/json-rpc-engine/v2';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { addPersonalMessage, addTypedMessage } from './util';
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
  } as MessageParamsTyped | MessageParamsPersonal;

  const originalRequestMock = {
    id: idMock,
  } as JsonRpcRequest;

  const makeSignatureParamsMock = (version?: string): SignatureParams => [
    messageParamsMock,
    originalRequestMock,
    new MiddlewareContext(),
    version,
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
      signatureParams: makeSignatureParamsMock(),
      signatureController: signatureControllerMock,
    };

    const result = await addTypedMessage(request);
    expect(result).toBe(hashMock);
  });

  it('should call endTrace with correct parameters', async () => {
    const request: AddSignatureMessageRequest = {
      signatureParams: makeSignatureParamsMock(),
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

  describe('trace context', () => {
    const traceContextMock = { name: 'Signature' };

    const makeRequestWithTraceContext = (version?: string) => {
      const requestContext = new MiddlewareContext();
      requestContext.set('traceContext', traceContextMock);
      const signatureParams: SignatureParams = [
        messageParamsMock,
        originalRequestMock,
        requestContext,
        version,
      ];
      return { signatureParams, signatureController: signatureControllerMock };
    };

    it('passes the trace context in the options of a personal message', async () => {
      await addPersonalMessage(makeRequestWithTraceContext());

      expect(
        signatureControllerMock.newUnsignedPersonalMessage,
      ).toHaveBeenCalledWith(messageParamsMock, expect.any(Object), {
        traceContext: traceContextMock,
      });
    });

    it('passes the version and the trace context in the options of a typed message', async () => {
      await addTypedMessage(makeRequestWithTraceContext('V4'));

      expect(
        signatureControllerMock.newUnsignedTypedMessage,
      ).toHaveBeenCalledWith(
        messageParamsMock,
        expect.any(Object),
        'V4',
        undefined,
        { traceContext: traceContextMock },
      );
    });
  });
});
