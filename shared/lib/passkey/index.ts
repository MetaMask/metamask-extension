export {
  startPasskeyRegistration,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  PasskeyCeremonyTimeoutError,
  isPasskeyCeremonySilentError,
} from './passkey-ceremony';
export {
  isPasskeyPRFSupported,
  isWebAuthnSupported,
} from './passkey-capabilities';
export {
  translatePasskeyError,
  getPasskeyErrorCode,
  type TranslateFn,
} from './passkey-error';
export {
  isPasskeyAaguidIncompatibleWithSidepanel,
  getPasskeyAuthenticatorName,
} from './passkey-sidepanel-aaguid';
export { getPasskeyAuthMethodKey } from './passkey-auth-method';
