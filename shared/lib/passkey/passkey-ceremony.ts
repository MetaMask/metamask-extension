import {
  startRegistration,
  startAuthentication,
  base64URLStringToBuffer,
  bufferToBase64URLString,
} from '@simplewebauthn/browser';
import type {
  PasskeyAuthenticationOptions,
  PasskeyRegistrationOptions,
  PasskeyAuthenticationResponse,
  PasskeyRegistrationResponse,
  PrfEvalExtension,
} from '@metamask/passkey-controller';

type ExtensionsWithPrf = AuthenticationExtensionsClientInputs & {
  prf?: PrfEvalExtension;
};

type PrfExtensionClient = {
  prf?: {
    enabled?: boolean;
    results?: { first?: ArrayBuffer };
  };
};

/**
 * Starts the WebAuthn registration ceremony.
 * Delegates to `@simplewebauthn/browser`, converting PRF extension
 * inputs from base64url strings to BufferSource (for the browser API)
 * and PRF outputs from ArrayBuffer back to base64url strings (for RPC).
 *
 * @param options - Registration options from the PasskeyController.
 * @see https://simplewebauthn.dev/docs/packages/browser#startregistration
 */
export async function startPasskeyRegistration(
  options: PasskeyRegistrationOptions,
): Promise<PasskeyRegistrationResponse> {
  const optionsJSON = preparePrfForBrowser(options);
  const response = await startRegistration({ optionsJSON });
  return {
    ...response,
    clientExtensionResults: preparePrfForTransport(
      response.clientExtensionResults,
    ),
  };
}

/**
 * Starts the WebAuthn authentication ceremony.
 * Delegates to `@simplewebauthn/browser`, converting PRF extension
 * inputs from base64url strings to BufferSource (for the browser API)
 * and PRF outputs from ArrayBuffer back to base64url strings (for RPC).
 *
 * @param options - Authentication options from the PasskeyController.
 * @see https://simplewebauthn.dev/docs/packages/browser#startauthentication
 */
export async function startPasskeyAuthentication(
  options: PasskeyAuthenticationOptions,
): Promise<PasskeyAuthenticationResponse> {
  const optionsJSON = preparePrfForBrowser(options);
  const response = await startAuthentication({ optionsJSON });
  return {
    ...response,
    clientExtensionResults: preparePrfForTransport(
      response.clientExtensionResults,
    ),
  };
}

function preparePrfForBrowser<
  Options extends PasskeyRegistrationOptions | PasskeyAuthenticationOptions,
>(options: Options): Options {
  const prfExt = (options.extensions as ExtensionsWithPrf | undefined)?.prf;
  if (!prfExt?.eval?.first || typeof prfExt.eval.first !== 'string') {
    return options;
  }
  return {
    ...options,
    extensions: {
      ...options.extensions,
      prf: {
        eval: { first: base64URLStringToBuffer(prfExt.eval.first) },
      },
    },
  } as Options;
}

function preparePrfForTransport(
  results: AuthenticationExtensionsClientOutputs,
): PasskeyRegistrationResponse['clientExtensionResults'] {
  const { prf } = results as PrfExtensionClient;
  if (!prf) {
    return results as PasskeyRegistrationResponse['clientExtensionResults'];
  }
  const first = prf.results?.first;
  return {
    ...results,
    prf: {
      enabled: prf.enabled,
      results:
        first !== undefined && new Uint8Array(first).byteLength > 0
          ? { first: bufferToBase64URLString(first) }
          : undefined,
    },
  } as PasskeyRegistrationResponse['clientExtensionResults'];
}
