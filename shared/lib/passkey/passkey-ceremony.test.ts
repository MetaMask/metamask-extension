import {
  WebAuthnAbortService,
  base64URLStringToBuffer,
  bufferToBase64URLString,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../constants/app';
import { getEnvironmentType } from '../environment-type';
import {
  PasskeyCeremonyTimeoutError,
  PASSKEY_SIDEPANEL_CEREMONY_TIMEOUT_MS,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  startPasskeyAuthentication,
  startPasskeyRegistration,
} from './passkey-ceremony';

jest.mock('@simplewebauthn/browser', () => ({
  WebAuthnAbortService: {
    cancelCeremony: jest.fn(),
  },
  base64URLStringToBuffer: jest.fn(),
  bufferToBase64URLString: jest.fn(),
  startAuthentication: jest.fn(),
  startRegistration: jest.fn(),
}));

jest.mock('../environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

const mockStartRegistration = jest.mocked(startRegistration);
const mockStartAuthentication = jest.mocked(startAuthentication);
const mockCancelCeremony = jest.mocked(WebAuthnAbortService.cancelCeremony);
const mockBase64UrlToBuffer = jest.mocked(base64URLStringToBuffer);
const mockBufferToBase64Url = jest.mocked(bufferToBase64URLString);
const mockGetEnvironmentType = jest.mocked(getEnvironmentType);

describe('passkey ceremony helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
  });

  describe('cancelPasskeyCeremony', () => {
    it('delegates cancellation to WebAuthnAbortService', () => {
      cancelPasskeyCeremony();

      expect(mockCancelCeremony).toHaveBeenCalledTimes(1);
    });
  });

  describe('startPasskeyRegistration', () => {
    it('runs registration without timeout outside sidepanel', async () => {
      const response = {
        id: 'credential-id',
        rawId: 'raw-id',
        response: {} as never,
        type: 'public-key',
        authenticatorAttachment: null,
        clientExtensionResults: {},
      };
      mockStartRegistration.mockResolvedValue(response as never);

      const result = await startPasskeyRegistration({
        challenge: 'abc',
      } as never);

      expect(mockStartRegistration).toHaveBeenCalledWith({
        optionsJSON: {
          challenge: 'abc',
          rp: { id: undefined },
        },
      });
      expect(result).toStrictEqual(response);
      expect(mockCancelCeremony).not.toHaveBeenCalled();
    });

    it('times out in sidepanel and cancels ceremony', async () => {
      jest.useFakeTimers();
      try {
        mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
        mockStartRegistration.mockImplementation(
          () => new Promise(() => undefined) as never,
        );

        const promise = startPasskeyRegistration({ challenge: 'abc' } as never);
        jest.advanceTimersByTime(PASSKEY_SIDEPANEL_CEREMONY_TIMEOUT_MS);

        await expect(promise).rejects.toBeInstanceOf(
          PasskeyCeremonyTimeoutError,
        );
        expect(mockCancelCeremony).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('decodes PRF eval.first and encodes non-empty PRF result', async () => {
      const firstBuffer = new Uint8Array([1, 2, 3]).buffer;
      mockBase64UrlToBuffer.mockReturnValue(firstBuffer);
      mockBufferToBase64Url.mockReturnValue('encoded-first');
      mockStartRegistration.mockResolvedValue({
        id: 'credential-id',
        rawId: 'raw-id',
        response: {} as never,
        type: 'public-key',
        authenticatorAttachment: null,
        clientExtensionResults: {
          prf: {
            enabled: true,
            results: { first: firstBuffer },
          },
        },
      } as never);

      const result = await startPasskeyRegistration({
        challenge: 'abc',
        extensions: {
          prf: {
            eval: {
              first: 'input-prf',
            },
          },
        },
      } as never);

      expect(mockBase64UrlToBuffer).toHaveBeenCalledWith('input-prf');
      expect(mockStartRegistration).toHaveBeenCalledWith({
        optionsJSON: {
          challenge: 'abc',
          rp: { id: undefined },
          extensions: {
            prf: {
              eval: {
                first: firstBuffer,
              },
            },
          },
        },
      });
      expect(mockBufferToBase64Url).toHaveBeenCalledWith(firstBuffer);
      expect(result.clientExtensionResults).toStrictEqual({
        prf: {
          enabled: true,
          results: { first: 'encoded-first' },
        },
      });
    });

    it('keeps PRF result undefined when first is empty', async () => {
      mockStartRegistration.mockResolvedValue({
        id: 'credential-id',
        rawId: 'raw-id',
        response: {} as never,
        type: 'public-key',
        authenticatorAttachment: null,
        clientExtensionResults: {
          prf: {
            enabled: true,
            results: { first: new Uint8Array([]).buffer },
          },
        },
      } as never);

      const result = await startPasskeyRegistration({
        challenge: 'abc',
      } as never);

      expect(mockBufferToBase64Url).not.toHaveBeenCalled();
      expect(result.clientExtensionResults).toStrictEqual({
        prf: {
          enabled: true,
          results: undefined,
        },
      });
    });
  });

  describe('startPasskeyAuthentication', () => {
    it('runs authentication and returns results without PRF transform when missing', async () => {
      const response = {
        id: 'credential-id',
        rawId: 'raw-id',
        response: {} as never,
        type: 'public-key',
        authenticatorAttachment: null,
        clientExtensionResults: {},
      };
      mockStartAuthentication.mockResolvedValue(response as never);

      const result = await startPasskeyAuthentication({
        challenge: 'abc',
      } as never);

      expect(mockStartAuthentication).toHaveBeenCalledWith({
        optionsJSON: { challenge: 'abc' },
      });
      expect(result).toStrictEqual(response);
    });

    it('decodes PRF eval.first string to buffer for authentication options', async () => {
      const firstBuffer = new Uint8Array([9, 9]).buffer;
      mockBase64UrlToBuffer.mockReturnValue(firstBuffer);
      mockStartAuthentication.mockResolvedValue({
        id: 'credential-id',
        rawId: 'raw-id',
        response: {} as never,
        type: 'public-key',
        authenticatorAttachment: null,
        clientExtensionResults: {},
      } as never);

      await startPasskeyAuthentication({
        challenge: 'abc',
        extensions: {
          prf: {
            eval: { first: 'input-prf' },
          },
        },
      } as never);

      expect(mockStartAuthentication).toHaveBeenCalledWith({
        optionsJSON: {
          challenge: 'abc',
          extensions: {
            prf: {
              eval: { first: firstBuffer },
            },
          },
        },
      });
    });
  });
});

describe('isPasskeyCeremonySilentError', () => {
  it('returns true for PasskeyCeremonyTimeoutError', () => {
    expect(
      isPasskeyCeremonySilentError(new PasskeyCeremonyTimeoutError()),
    ).toBe(true);
  });

  it('returns true for DOMException NotAllowedError', () => {
    expect(
      isPasskeyCeremonySilentError(
        new DOMException('cancelled', 'NotAllowedError'),
      ),
    ).toBe(true);
  });

  it('returns true for Error named AbortError', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(isPasskeyCeremonySilentError(err)).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isPasskeyCeremonySilentError(new Error('network'))).toBe(false);
    expect(isPasskeyCeremonySilentError(null)).toBe(false);
    expect(isPasskeyCeremonySilentError(undefined)).toBe(false);
  });
});
