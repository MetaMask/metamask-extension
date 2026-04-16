import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import { checkPasskeyCapabilities } from './passkey-capabilities';

// eslint-disable-next-line @typescript-eslint/no-require-imports

jest.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: jest.fn(),
  platformAuthenticatorIsAvailable: jest.fn(),
}));

const mockBrowserSupportsWebAuthn = jest.mocked(browserSupportsWebAuthn);
const mockPlatformAuthenticatorIsAvailable = jest.mocked(
  platformAuthenticatorIsAvailable,
);

describe('checkPasskeyCapabilities', () => {
  const originalPublicKeyCredential = globalThis.PublicKeyCredential;

  afterEach(() => {
    jest.resetAllMocks();
    if (originalPublicKeyCredential) {
      globalThis.PublicKeyCredential = originalPublicKeyCredential;
    } else {
      delete (globalThis as Record<string, unknown>).PublicKeyCredential;
    }
  });

  it('returns all false when WebAuthn is not supported', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(false);

    const result = await checkPasskeyCapabilities();

    expect(result).toStrictEqual({
      webAuthnSupported: false,
      platformAuthenticatorAvailable: false,
      prfSupported: false,
    });
  });

  it('returns prfSupported=true when getClientCapabilities reports extension:prf', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    mockPlatformAuthenticatorIsAvailable.mockResolvedValue(true);
    globalThis.PublicKeyCredential = {
      getClientCapabilities: jest
        .fn()
        .mockResolvedValue({ 'extension:prf': true }),
    } as unknown as typeof PublicKeyCredential;

    const result = await checkPasskeyCapabilities();

    expect(result).toStrictEqual({
      webAuthnSupported: true,
      platformAuthenticatorAvailable: true,
      prfSupported: true,
    });
  });

  it('returns prfSupported=false when getClientCapabilities omits extension:prf', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    mockPlatformAuthenticatorIsAvailable.mockResolvedValue(true);
    globalThis.PublicKeyCredential = {
      getClientCapabilities: jest.fn().mockResolvedValue({}),
    } as unknown as typeof PublicKeyCredential;

    const result = await checkPasskeyCapabilities();

    expect(result).toStrictEqual({
      webAuthnSupported: true,
      platformAuthenticatorAvailable: true,
      prfSupported: false,
    });
  });

  it('returns prfSupported=false when extension:prf is explicitly false', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    mockPlatformAuthenticatorIsAvailable.mockResolvedValue(true);
    globalThis.PublicKeyCredential = {
      getClientCapabilities: jest
        .fn()
        .mockResolvedValue({ 'extension:prf': false }),
    } as unknown as typeof PublicKeyCredential;

    const result = await checkPasskeyCapabilities();

    expect(result).toStrictEqual({
      webAuthnSupported: true,
      platformAuthenticatorAvailable: true,
      prfSupported: false,
    });
  });

  it('returns prfSupported=undefined when getClientCapabilities is not available', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    mockPlatformAuthenticatorIsAvailable.mockResolvedValue(true);
    globalThis.PublicKeyCredential =
      {} as unknown as typeof PublicKeyCredential;

    const result = await checkPasskeyCapabilities();

    expect(result).toStrictEqual({
      webAuthnSupported: true,
      platformAuthenticatorAvailable: true,
      prfSupported: undefined,
    });
  });

  it('returns platformAuthenticatorAvailable=false when no platform authenticator', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    mockPlatformAuthenticatorIsAvailable.mockResolvedValue(false);
    globalThis.PublicKeyCredential =
      {} as unknown as typeof PublicKeyCredential;

    const result = await checkPasskeyCapabilities();

    expect(result).toStrictEqual({
      webAuthnSupported: true,
      platformAuthenticatorAvailable: false,
      prfSupported: undefined,
    });
  });
});
