export enum FirstTimeFlowType {
  /**
   * When a user imports a wallet from a seed phrase they will have the
   * 'import' firstTimeFlowType.
   */
  import = 'import',
  /**
   * When a user creates a new wallet during onboarding they will have the
   * 'create' firstTimeFlowType.
   */
  create = 'create',
  /**
   * A special case for when a user's MetaMask encounters an error during the
   * loading of state. They will be presented with an option to restore their
   * MetaMask if their vault was backed up. This will set their
   * firstTimeFlowType to 'restore'.
   */
  restore = 'restore',
  /**
   * When a user logins with Social Login and goes through the Seedless Onboarding flow,
   * they will have the 'seedless' firstTimeFlowType.
   */
  seedless = 'seedless',
}
