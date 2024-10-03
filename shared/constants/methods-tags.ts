/**
 * This is a list of methods that require the globally selected network
 * to match the dapp selected network before being processed. These can
 * be for UI/UX reasons where the currently selected network is displayed
 * in the confirmation even though it will be submitted on the correct
 * network for the dapp. It could also be that a method expects the
 * globally selected network to match some value in the request params itself.
 */
export const methodsRequiringNetworkSwitch = [
  'eth_sendTransaction',
  'eth_sendRawTransaction',
  'wallet_switchEthereumChain',
  'wallet_watchAsset',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
] as const;
