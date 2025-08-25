export enum FirstTimeFlowType {
  /**
   * When a user imports a wallet from a seed phrase they will have the
   * 'import' firstTimeFlowType.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  import = 'import',
  /**
   * When a user creates a new wallet during onboarding they will have the
   * 'create' firstTimeFlowType.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  create = 'create',
  /**
   * A special case for when a user's MetaMask encounters an error during the
   * loading of state. They will be presented with an option to restore their
   * MetaMask if their vault was backed up. This will set their
   * firstTimeFlowType to 'restore'.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  restore = 'restore',
  /**
   * When a user logins with Social Login and creates a new wallet,
   * they will have the 'socialCreate' firstTimeFlowType.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  socialCreate = 'socialCreate',
  /**
   * When a user logins with Social Login and imports their wallet,
   * they will have the 'socialImport' firstTimeFlowType.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  socialImport = 'socialImport',
}
