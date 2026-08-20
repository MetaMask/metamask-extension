export {
  startPasskeyRegistration,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  PasskeyCeremonyTimeoutError,
  isPasskeyCeremonySilentError,
} from './passkey-ceremony';
export {
  hasPasskeyPRFEnabled,
  hasPasskeyPRFResult,
  isPasskeyPRFSupported,
  isWebAuthnSupported,
  PasskeyPRFRequiredError,
} from './passkey-capabilities';
export {
  translatePasskeyError,
  getPasskeyErrorCode,
  type TranslateFn,
} from './passkey-error';
export { isPasskeyAaguidIncompatibleWithSidepanel } from './passkey-sidepanel-aaguid';
export { getPasskeyAuthMethodKey } from './passkey-auth-method';
