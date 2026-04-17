import {
  startRegistration,
  startAuthentication,
  base64URLStringToBuffer,
  bufferToBase64URLString,
  WebAuthnAbortService,
} from '@simplewebauthn/browser';
import type {
  PasskeyAuthenticationOptions,
  PasskeyRegistrationOptions,
  PasskeyAuthenticationResponse,
  PasskeyRegistrationResponse,
  PrfEvalExtension,
} from '@metamask/passkey-controller';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../constants/app';
import { getEnvironmentType } from '../environment-type';

/**
 * Wall-clock cap for WebAuthn in the **side panel** only (where ceremonies often hang).
 * Popup/fullscreen rely on the browser/OS without an extra app timeout.
 */
export const PASSKEY_SIDEPANEL_CEREMONY_TIMEOUT_MS = 30_000;

export class PasskeyCeremonyTimeoutError extends Error {
  override readonly name = 'PasskeyCeremonyTimeoutError';

  constructor() {
    super('Passkey ceremony timed out');
    Object.setPrototypeOf(this, PasskeyCeremonyTimeoutError.prototype);
  }
}

/**
 * Aborts the in-flight WebAuthn request without starting a new ceremony.
 * Call from unmount, “use password”, or when leaving the passkey step.
 */
export function cancelPasskeyCeremony(): void {
  WebAuthnAbortService.cancelCeremony();
}

type ExtensionsWithPrf = AuthenticationExtensionsClientInputs & {
  prf?: PrfEvalExtension;
};

type PrfExtensionClient = {
  prf?: {
    enabled?: boolean;
    results?: { first?: ArrayBuffer };
  };
};

async function withPasskeyCeremonyTimeout<TResult>(
  ceremony: () => Promise<TResult>,
  timeoutMs: number,
): Promise<TResult> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      WebAuthnAbortService.cancelCeremony();
      reject(new PasskeyCeremonyTimeoutError());
    }, timeoutMs);
  });
  try {
    return await Promise.race([ceremony(), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function runPasskeyCeremony<TResult>(
  ceremony: () => Promise<TResult>,
): Promise<TResult> {
  if (getEnvironmentType() !== ENVIRONMENT_TYPE_SIDEPANEL) {
    return ceremony();
  }
  return withPasskeyCeremonyTimeout(
    ceremony,
    PASSKEY_SIDEPANEL_CEREMONY_TIMEOUT_MS,
  );
}

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
  return runPasskeyCeremony(async () => {
    const optionsJSON = preparePrfForBrowser(options);
    const response = await startRegistration({ optionsJSON });
    return {
      ...response,
      clientExtensionResults: preparePrfForTransport(
        response.clientExtensionResults,
      ),
    };
  });
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
  return runPasskeyCeremony(async () => {
    const optionsJSON = preparePrfForBrowser(options);
    const response = await startAuthentication({ optionsJSON });
    return {
      ...response,
      clientExtensionResults: preparePrfForTransport(
        response.clientExtensionResults,
      ),
    };
  });
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
