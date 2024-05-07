/**
 * This is a list of methods that require the globally selected network
 * to match the dapp selected network before being processed. These can
 * be for UI/UX reasons where the currently selected network is displayed
 * in the confirmation even though it will be submitted on the correct
 * network for the dapp. It could also be that a method expects the
 * globally selected network to match some value in the request params itself.
 */
export const methodsRequiringNetworkSwitch = Object.freeze([
  'eth_sendTransaction' as const,
  'eth_sendRawTransaction' as const,
  'wallet_switchEthereumChain' as const,
  'wallet_addEthereumChain' as const,
  'wallet_watchAsset' as const,
  'eth_signTypedData_v4' as const,
  'personal_sign' as const,
]);

/**
 * This is a list of methods that can cause a confirmation to be
 * presented to the user. Note that some of these methods may
 * only sometimes cause a confirmation to appear.
 */
export const methodsWithConfirmation = [
  ...methodsRequiringNetworkSwitch,
  'wallet_requestPermissions',
  'wallet_requestSnaps',
  'eth_decrypt',
  'eth_sign',
  'eth_requestAccounts',
  'eth_getEncryptionPublicKey',
];
