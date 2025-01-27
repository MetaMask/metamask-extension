// Current version of state metadata
export const STATE_METADATA_VERSION = 74;

export class StateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateValidationError';
  }
}

export interface StateValidatorState {
  version: number;
  networkConfiguration: {
    chainId: string;
    rpcUrl: string;
    ticker: string;
  };
  accountConfiguration: {
    address: string;
    type: string;
  };
  preferences: {
    privacyMode: boolean;
    showTestNetworks: boolean;
  };
}

export class StateValidator {
  validateState(state: StateValidatorState): void {
    this.validateVersion(state.version);
    this.validateNetworkConfiguration(state.networkConfiguration);
    this.validateAccountConfiguration(state.accountConfiguration);
    this.validatePreferences(state.preferences);
  }

  private validateVersion(version: number): void {
    if (version !== STATE_METADATA_VERSION) {
      throw new StateValidationError(
        `State version mismatch. Expected version ${STATE_METADATA_VERSION} but got ${version}`,
      );
    }
  }

  private validateNetworkConfiguration(
    config: StateValidatorState['networkConfiguration'],
  ): void {
    if (!config.chainId || !config.rpcUrl || !config.ticker) {
      throw new StateValidationError('Invalid network configuration');
    }
  }

  private validateAccountConfiguration(
    config: StateValidatorState['accountConfiguration'],
  ): void {
    if (!config.address || !config.type) {
      throw new StateValidationError('Invalid account configuration');
    }
  }

  private validatePreferences(prefs: StateValidatorState['preferences']): void {
    if (
      typeof prefs.privacyMode !== 'boolean' ||
      typeof prefs.showTestNetworks !== 'boolean'
    ) {
      throw new StateValidationError('Invalid preferences configuration');
    }
  }
}
