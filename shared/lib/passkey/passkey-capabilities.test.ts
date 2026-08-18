import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import {
  hasPasskeyPRFEnabled,
  hasPasskeyPRFResult,
  isPasskeyPRFSupported,
  isWebAuthnSupported,
  PasskeyPRFRequiredError,
} from './passkey-capabilities';

jest.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: jest.fn(),
}));

const mockBrowserSupportsWebAuthn = jest.mocked(browserSupportsWebAuthn);

describe('PasskeyPRFRequiredError', () => {
  it('uses a stable name and message', () => {
    const error = new PasskeyPRFRequiredError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PasskeyPRFRequiredError');
    expect(error.message).toBe('Passkey setup requires PRF support');
  });
});

describe('isWebAuthnSupported', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns true when browserSupportsWebAuthn returns true', () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    expect(isWebAuthnSupported()).toBe(true);
  });

  it('returns false when browserSupportsWebAuthn returns false', () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(false);
    expect(isWebAuthnSupported()).toBe(false);
  });
});

describe('isPasskeyPRFSupported', () => {
  const originalPublicKeyCredential = globalThis.PublicKeyCredential;

  afterEach(() => {
    jest.resetAllMocks();
    if (originalPublicKeyCredential) {
      globalThis.PublicKeyCredential = originalPublicKeyCredential;
    } else {
      delete (globalThis as Record<string, unknown>).PublicKeyCredential;
    }
  });

  it('returns false when WebAuthn is not supported', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(false);

    const result = await isPasskeyPRFSupported();

    expect(result).toBe(false);
  });

  it('returns true when getClientCapabilities reports extension:prf', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    globalThis.PublicKeyCredential = {
      getClientCapabilities: jest
        .fn()
        .mockResolvedValue({ 'extension:prf': true }),
    } as unknown as typeof PublicKeyCredential;

    const result = await isPasskeyPRFSupported();

    expect(result).toBe(true);
  });

  it('returns false when getClientCapabilities omits extension:prf', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    globalThis.PublicKeyCredential = {
      getClientCapabilities: jest.fn().mockResolvedValue({}),
    } as unknown as typeof PublicKeyCredential;

    const result = await isPasskeyPRFSupported();

    expect(result).toBe(false);
  });

  it('returns false when extension:prf is explicitly false', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    globalThis.PublicKeyCredential = {
      getClientCapabilities: jest
        .fn()
        .mockResolvedValue({ 'extension:prf': false }),
    } as unknown as typeof PublicKeyCredential;

    const result = await isPasskeyPRFSupported();

    expect(result).toBe(false);
  });

  it('returns undefined when getClientCapabilities is not available', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    globalThis.PublicKeyCredential =
      {} as unknown as typeof PublicKeyCredential;

    const result = await isPasskeyPRFSupported();

    expect(result).toBeUndefined();
  });
});

describe('hasPasskeyPRFResult', () => {
  it('returns true when the response contains a PRF result', () => {
    expect(
      hasPasskeyPRFResult({
        clientExtensionResults: { prf: { results: { first: 'AQ' } } },
      }),
    ).toBe(true);
  });

  it('returns false when the response does not contain a PRF result', () => {
    expect(hasPasskeyPRFResult({ clientExtensionResults: {} })).toBe(false);
    expect(hasPasskeyPRFResult({})).toBe(false);
  });
});

describe('hasPasskeyPRFEnabled', () => {
  it('returns true when the registration response enables PRF', () => {
    expect(
      hasPasskeyPRFEnabled({
        clientExtensionResults: { prf: { enabled: true } },
      }),
    ).toBe(true);
  });

  it('returns false when PRF is disabled or missing', () => {
    expect(
      hasPasskeyPRFEnabled({
        clientExtensionResults: { prf: { enabled: false } },
      }),
    ).toBe(false);
    expect(hasPasskeyPRFEnabled({ clientExtensionResults: {} })).toBe(false);
    expect(hasPasskeyPRFEnabled({})).toBe(false);
  });
});
