import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import {
  buildPasskeyCreateOptions,
  buildPasskeyGetOptions,
  createDevPasskey,
  PASSKEY_RP_ID,
  verifyDevPasskey,
} from './passkeyDevTest';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (array: Uint8Array) => {
      array.fill(1);
      return array;
    },
  },
  configurable: true,
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

jest.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: jest.fn(() => true),
  startRegistration: jest.fn(),
  startAuthentication: jest.fn(),
  bufferToBase64URLString: (bytes: Uint8Array) =>
    Buffer.from(bytes).toString('base64url'),
}));

describe('passkeyDevTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    jest.mocked(browserSupportsWebAuthn).mockReturnValue(true);
  });

  it('builds a create request for the dev rpId', () => {
    const request = buildPasskeyCreateOptions('dXNlci1pZA');

    expect(request.rp.id).toBe(PASSKEY_RP_ID);
    expect(request.rp.id).toBe('matthiasgeihs.github.io');
    expect(request.user.id).toBe('dXNlci1pZA');
    expect(request.challenge).toBeTruthy();
    expect(request.authenticatorSelection?.residentKey).toBe('required');
  });

  it('builds a get request with stored credential id when available', async () => {
    localStorageMock.setItem(
      'passkey_dev_test_credential_id',
      'stored-credential-id',
    );

    const request = await buildPasskeyGetOptions();

    expect(request.rpId).toBe('matthiasgeihs.github.io');
    expect(request.allowCredentials).toStrictEqual([
      { type: 'public-key', id: 'stored-credential-id' },
    ]);
  });

  it('builds a get request without allowCredentials when none is stored', async () => {
    const request = await buildPasskeyGetOptions();

    expect(request.rpId).toBe('matthiasgeihs.github.io');
    expect(request.allowCredentials).toBeUndefined();
  });

  it('creates and stores a dev passkey credential id', async () => {
    jest.mocked(startRegistration).mockResolvedValue({
      id: 'new-credential-id',
      rawId: 'new-credential-id',
      response: {
        clientDataJSON: 'client-data',
        attestationObject: 'attestation-object',
      },
      clientExtensionResults: {},
      type: 'public-key',
      authenticatorAttachment: 'platform',
    });

    const result = await createDevPasskey();

    expect(result.id).toBe('new-credential-id');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'passkey_dev_test_user_id',
      expect.any(String),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'passkey_dev_test_credential_id',
      'new-credential-id',
    );
  });

  it('verifies a dev passkey', async () => {
    localStorageMock.setItem(
      'passkey_dev_test_credential_id',
      'stored-credential-id',
    );
    jest.mocked(startAuthentication).mockResolvedValue({
      id: 'stored-credential-id',
      rawId: 'stored-credential-id',
      response: {
        authenticatorData: 'auth-data',
        clientDataJSON: 'client-data',
        signature: 'signature',
      },
      clientExtensionResults: {},
      type: 'public-key',
      authenticatorAttachment: 'platform',
    });

    const result = await verifyDevPasskey();

    expect(result.id).toBe('stored-credential-id');
    expect(startAuthentication).toHaveBeenCalledWith(
      expect.objectContaining({
        optionsJSON: expect.objectContaining({
          rpId: 'matthiasgeihs.github.io',
          allowCredentials: [
            { type: 'public-key', id: 'stored-credential-id' },
          ],
        }),
      }),
    );
  });
});
