export const ALERT_TYPES = {
  unconnectedAccount: 'unconnectedAccount',
  web3ShimUsage: 'web3ShimUsage',
  invalidCustomNetwork: 'invalidCustomNetwork',
};

/**
 * Alerts that can be enabled or disabled by the user.
 */
export const TOGGLEABLE_ALERT_TYPES = [
  ALERT_TYPES.unconnectedAccount,
  ALERT_TYPES.web3ShimUsage,
];

export const WEB3_SHIM_USAGE_ALERT_STATES = {
  RECORDED: 1,
  DISMISSED: 2,
};
