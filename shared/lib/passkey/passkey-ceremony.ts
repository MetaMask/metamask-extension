import {
  startRegistration,
  startAuthentication,
  base64URLStringToBuffer,
  bufferToBase64URLString,
  WebAuthnAbortService,
  PublicKeyCredentialCreationOptionsJSON as SwaPublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON as SwaPublicKeyCredentialRequestOptionsJSON,
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
 * Whether a failed ceremony should be treated as a non-error in the UI (user left the
 * flow, the request was superseded, or the app gave up waiting).
 *
 * @param error - Rejection from a passkey registration or authentication attempt.
 */
export function isPasskeyCeremonySilentError(error: unknown): boolean {
  if (error instanceof PasskeyCeremonyTimeoutError) {
    return true;
  }
  const name = error instanceof Error ? error.name : '';
  return name === 'NotAllowedError' || name === 'AbortError';
}

/**
 * Cancels any in-flight passkey ceremony, for example when the user leaves the step or
 * chooses another path.
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

/**
 * Runs a ceremony but fails it if it does not finish within the given time limit.
 *
 * @param ceremony - Async work that performs the WebAuthn call.
 * @param timeoutMs - Maximum time to wait before treating the ceremony as failed.
 */
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

/**
 * Runs a passkey ceremony with stricter completion expectations where the UI is most
 * likely to get stuck waiting on the OS prompt.
 *
 * @param ceremony - Async work that performs the WebAuthn call.
 */
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
 * Runs passkey registration in the browser from controller options and returns a
 * response the controller can verify and persist.
 *
 * @param options - Registration options from PasskeyController.
 * @see https://simplewebauthn.dev/docs/packages/browser#startregistration
 */
export async function startPasskeyRegistration(
  options: PasskeyRegistrationOptions,
): Promise<PasskeyRegistrationResponse> {
  return runPasskeyCeremony(async () => {
    const optionsJSON: SwaPublicKeyCredentialCreationOptionsJSON = {
      ...options,
      rp: {
        ...options.rp,
        id: undefined, // leave blank to accept the extension's default RP ID
      },
      extensions: decodePrfInExtensionOptions(options.extensions),
    };
    const response = await startRegistration({ optionsJSON });
    return {
      ...response,
      clientExtensionResults: encodePrfInClientExtensionResults(
        response.clientExtensionResults,
      ),
    };
  });
}

/**
 * Runs passkey authentication in the browser from controller options and returns a
 * response the controller can verify.
 *
 * @param options - Authentication options from PasskeyController.
 * @see https://simplewebauthn.dev/docs/packages/browser#startauthentication
 */
export async function startPasskeyAuthentication(
  options: PasskeyAuthenticationOptions,
): Promise<PasskeyAuthenticationResponse> {
  return runPasskeyCeremony(async () => {
    const optionsJSON: SwaPublicKeyCredentialRequestOptionsJSON = {
      ...options,
      rpId: undefined, // leave blank to accept the browser extension's default RP ID
      extensions: decodePrfInExtensionOptions(options.extensions),
    };
    const response = await startAuthentication({ optionsJSON });
    return {
      ...response,
      clientExtensionResults: encodePrfInClientExtensionResults(
        response.clientExtensionResults,
      ),
    };
  });
}

/**
 * Ensures optional PRF inputs on passkey options match what a browser ceremony expects.
 *
 * @param extensions - Optional passkey extensions from PasskeyController options.
 */
function decodePrfInExtensionOptions<
  Extensions extends
    | PasskeyRegistrationOptions['extensions']
    | PasskeyAuthenticationOptions['extensions'],
>(extensions: Extensions): Extensions {
  const prfExt = (extensions as ExtensionsWithPrf | undefined)?.prf;
  if (!prfExt?.eval?.first || typeof prfExt.eval.first !== 'string') {
    return extensions;
  }
  return {
    ...extensions,
    prf: {
      eval: { first: base64URLStringToBuffer(prfExt.eval.first) },
    },
  } as Extensions;
}

/**
 * Ensures optional PRF outputs on credential extension results match what PasskeyController
 * expects when the ceremony completes.
 *
 * @param results - Extension results from the WebAuthn ceremony.
 */
function encodePrfInClientExtensionResults(
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
