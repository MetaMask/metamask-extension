import {
  bytesToBase64URL,
  webauthnWireBinaryToBytes,
} from '@metamask/passkey-controller';
import type {
  PasskeyAuthenticationOptions,
  PasskeyRegistrationOptions,
  PasskeyAuthenticationResponse,
  PasskeyRegistrationResponse,
} from '@metamask/passkey-controller';

type PrfExtensionClient = {
  prf?: {
    enabled?: boolean;
    results?: { first?: ArrayBuffer };
  };
};

function clientExtensionResultsToWire(
  results: AuthenticationExtensionsClientOutputs,
): PasskeyRegistrationResponse['clientExtensionResults'] {
  const { prf } = results as PrfExtensionClient;
  if (!prf) {
    return undefined;
  }
  const first = prf.results?.first;
  return {
    prf: {
      enabled: prf.enabled,
      results:
        first !== undefined && new Uint8Array(first).byteLength > 0
          ? { first: bytesToBase64URL(new Uint8Array(first)) }
          : undefined,
    },
  };
}

function toBufferSource(bytes: Uint8Array): BufferSource {
  return new Uint8Array(bytes);
}

export class PasskeyCeremonyExtensionAdapter {
  /**
   * Starts the WebAuthn registration ceremony (`navigator.credentials.create`).
   * Same role as `@simplewebauthn/browser`'s `startRegistration` (this extension does not
   * depend on that package): accepts JSON wire options from the background RP and returns
   * a registration response JSON for RPC.
   *
   * @param options - `PublicKeyCredentialCreationOptionsJSON`-shaped options from the RP.
   * @see https://simplewebauthn.dev/docs/packages/browser#startregistration
   */
  async startRegistration(
    options: PasskeyRegistrationOptions,
  ): Promise<PasskeyRegistrationResponse> {
    const publicKey: PublicKeyCredentialCreationOptions = {
      rp: { ...options.rp },
      user: {
        id: toBufferSource(webauthnWireBinaryToBytes(options.user.id)),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      challenge: toBufferSource(webauthnWireBinaryToBytes(options.challenge)),
      pubKeyCredParams: options.pubKeyCredParams,
    };

    if (options.timeout !== undefined) {
      publicKey.timeout = options.timeout;
    }
    if (options.excludeCredentials?.length) {
      publicKey.excludeCredentials = options.excludeCredentials.map((d) => ({
        type: 'public-key' as const,
        id: toBufferSource(webauthnWireBinaryToBytes(d.id)),
      }));
    }
    if (options.authenticatorSelection) {
      publicKey.authenticatorSelection =
        options.authenticatorSelection as AuthenticatorSelectionCriteria;
    }
    if (options.attestation) {
      publicKey.attestation =
        options.attestation as AttestationConveyancePreference;
    }
    if (options.hints !== undefined && options.hints.length > 0) {
      (
        publicKey as PublicKeyCredentialCreationOptions & { hints?: string[] }
      ).hints = [...options.hints];
    }
    if (options.extensions?.prf?.eval?.first) {
      publicKey.extensions = {
        prf: {
          eval: {
            first: toBufferSource(
              webauthnWireBinaryToBytes(options.extensions.prf.eval.first),
            ),
          },
        },
      } as AuthenticationExtensionsClientInputs;
    }

    const credential = await navigator.credentials.create({ publicKey });
    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error('Passkey registration cancelled');
    }

    const attestation = credential.response as AuthenticatorAttestationResponse;
    const transports =
      typeof attestation.getTransports === 'function'
        ? attestation.getTransports()
        : undefined;

    return {
      id: bytesToBase64URL(new Uint8Array(credential.rawId)),
      rawId: bytesToBase64URL(new Uint8Array(credential.rawId)),
      type: 'public-key',
      response: {
        clientDataJSON: bytesToBase64URL(
          new Uint8Array(attestation.clientDataJSON),
        ),
        attestationObject: bytesToBase64URL(
          new Uint8Array(attestation.attestationObject),
        ),
        ...(transports?.length ? { transports } : {}),
      },
      clientExtensionResults: clientExtensionResultsToWire(
        credential.getClientExtensionResults(),
      ),
    };
  }

  /**
   * Starts the WebAuthn authentication ceremony (`navigator.credentials.get`).
   * Same role as `@simplewebauthn/browser`'s `startAuthentication` (this extension does not
   * depend on that package): accepts JSON wire options from the background RP and returns
   * an authentication response JSON for RPC.
   *
   * @param options - `PublicKeyCredentialRequestOptionsJSON`-shaped options from the RP.
   * @see https://simplewebauthn.dev/docs/packages/browser#startauthentication
   */
  async startAuthentication(
    options: PasskeyAuthenticationOptions,
  ): Promise<PasskeyAuthenticationResponse> {
    // build authentication options
    const allow = options.allowCredentials ?? [];
    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge: toBufferSource(webauthnWireBinaryToBytes(options.challenge)),
      allowCredentials: allow.map((d) => ({
        type: 'public-key' as const,
        id: toBufferSource(webauthnWireBinaryToBytes(d.id)),
      })),
      userVerification: options.userVerification,
      timeout: options.timeout,
      rpId: options.rpId,
      // TODO: add hints
      extensions: options.extensions?.prf?.eval?.first
        ? {
            prf: {
              eval: {
                first: toBufferSource(
                  webauthnWireBinaryToBytes(options.extensions.prf.eval.first),
                ),
              },
            },
          }
        : undefined,
    };

    // get credential from the browser
    const credential = await navigator.credentials.get({
      publicKey: requestOptions,
    });
    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error('Passkey authentication cancelled');
    }

    const assertion = credential.response as AuthenticatorAssertionResponse;
    const userHandle =
      assertion.userHandle && assertion.userHandle.byteLength > 0
        ? bytesToBase64URL(new Uint8Array(assertion.userHandle))
        : undefined;

    return {
      id: bytesToBase64URL(new Uint8Array(credential.rawId)),
      rawId: bytesToBase64URL(new Uint8Array(credential.rawId)),
      type: 'public-key',
      response: {
        clientDataJSON: bytesToBase64URL(
          new Uint8Array(assertion.clientDataJSON),
        ),
        authenticatorData: bytesToBase64URL(
          new Uint8Array(assertion.authenticatorData),
        ),
        signature: bytesToBase64URL(new Uint8Array(assertion.signature)),
        ...(userHandle === undefined ? {} : { userHandle }),
      },
      clientExtensionResults: clientExtensionResultsToWire(
        credential.getClientExtensionResults(),
      ),
    };
  }
}
