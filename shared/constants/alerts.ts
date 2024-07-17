export enum AlertTypes {
  web3ShimUsage = 'web3ShimUsage',
  invalidCustomNetwork = 'invalidCustomNetwork',
}

/**
 * Alerts that can be enabled or disabled by the user.
 */
export const TOGGLEABLE_ALERT_TYPES = [AlertTypes.web3ShimUsage];

export enum Web3ShimUsageAlertStates {
  recorded = 1,
  dismissed = 2,
}
