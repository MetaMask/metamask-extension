import type {
  CreationParams,
  AssertionParams,
  CredentialCreationResult,
  AssertionResult,
} from '@metamask/passkey-controller';

type PrfExtensionResults = {
  prf?: {
    enabled?: boolean;
    results?: { first?: ArrayBuffer };
  };
};

/**
 * Some browsers omit `prf.enabled` on `navigator.credentials.create()` even when the
 * PRF extension runs and returns `results.first`. The passkeyprf.com playground treats
 * non-empty `results.first` as proof of support (same for `get()`).
 *
 * @param prf - `prf` entry from `getClientExtensionResults()`, if any.
 * @see https://www.passkeyprf.com/
 */
function hasPrfEvalFirstOutput(
  prf: PrfExtensionResults['prf'] | undefined,
): boolean {
  const first = prf?.results?.first;
  if (first === undefined) {
    return false;
  }
  return new Uint8Array(first).byteLength > 0;
}

/**
 * DOM / WebAuthn typings expect `BufferSource` backed by `ArrayBuffer`. Values typed as
 * `Uint8Array` from callers may use `ArrayBufferLike` (e.g. `SharedArrayBuffer`) in TS 5.7+.
 * Copying yields a `Uint8Array` that satisfies `BufferSource`.
 *
 * @param bytes - Input bytes (may be typed with `ArrayBufferLike` backing).
 */
function toBufferSource(bytes: Uint8Array): BufferSource {
  return new Uint8Array(bytes);
}

function randomChallenge(length = 32): BufferSource {
  const challenge = new Uint8Array(length);
  crypto.getRandomValues(challenge);
  return challenge as BufferSource;
}

export class PasskeyCeremonyExtensionAdapter {
  async createCredential(
    params: CreationParams,
  ): Promise<CredentialCreationResult> {
    const options: CredentialCreationOptions = {
      publicKey: {
        rp: { name: 'MetaMask' },
        user: {
          id: toBufferSource(params.userHandle),
          name: 'MetaMask User',
          displayName: 'MetaMask',
        },
        challenge: randomChallenge(),
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required',
          authenticatorAttachment: 'platform',
        },
        extensions: {
          prf: { eval: { first: toBufferSource(params.prfSalt) } },
        } as AuthenticationExtensionsClientInputs,
      },
    };

    const credential = await navigator.credentials.create(options);
    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error('Passkey creation cancelled');
    }

    const { prf } =
      credential.getClientExtensionResults() as PrfExtensionResults;

    return {
      credentialId: new Uint8Array(credential.rawId),
      userHandle: params.userHandle,
      prfEnabled: prf?.enabled === true || hasPrfEvalFirstOutput(prf),
      prfFirst: prf?.results?.first,
    };
  }

  async getAssertion(params: AssertionParams): Promise<AssertionResult> {
    const extensions: AuthenticationExtensionsClientInputs =
      params.usePrf && params.prfSalt
        ? ({
            prf: { eval: { first: toBufferSource(params.prfSalt) } },
          } as AuthenticationExtensionsClientInputs)
        : {};

    const options: CredentialRequestOptions = {
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [
          { id: toBufferSource(params.credentialId), type: 'public-key' },
        ],
        userVerification: 'required',
        extensions,
      },
    };

    const credential = await navigator.credentials.get(options);
    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error('Passkey authentication cancelled');
    }

    const response = credential.response as AuthenticatorAssertionResponse;
    const extResults =
      credential.getClientExtensionResults() as PrfExtensionResults;

    return {
      userHandle: response.userHandle ?? undefined,
      prfFirst: extResults.prf?.results?.first,
    };
  }
}
