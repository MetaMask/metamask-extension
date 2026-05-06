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
  ExtensionPasskeyErrorCode,
  translatePasskeyError,
} from './passkey-error';
export {
  normalizePasskeyAaguid,
  isPasskeyAaguidIncompatibleWithSidepanel,
} from './passkey-sidepanel-aaguid';
