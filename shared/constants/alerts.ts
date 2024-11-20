export enum AlertTypes {
  unconnectedAccount = 'unconnectedAccount',
  web3ShimUsage = 'web3ShimUsage',
  invalidCustomNetwork = 'invalidCustomNetwork',
  stxMigration = 'stxMigration',
}

/**
 * Alerts that can be enabled or disabled by the user.
 */
export const TOGGLEABLE_ALERT_TYPES = [
  AlertTypes.unconnectedAccount,
  AlertTypes.web3ShimUsage,
  AlertTypes.stxMigration,
];

export enum Web3ShimUsageAlertStates {
  recorded = 1,
  dismissed = 2,
}
