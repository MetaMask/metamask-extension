// Current version of state metadata
export const STATE_METADATA_VERSION = 74;

interface StateValidatorOptions {
  throwOnError?: boolean;
}

export class StateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateValidationError';
  }
}

/**
 * Validates critical aspects of the extension state that aren't covered by type safety
 */
export class StateValidator {
  private throwOnError: boolean;

  constructor(options: StateValidatorOptions = {}) {
    this.throwOnError = options.throwOnError ?? true;
  }

  /**
   * Validates the extension state
   * @param state - The extension state to validate
   * @throws {StateValidationError} If validation fails and throwOnError is true
   * @returns {boolean} True if validation passes, false otherwise
   */
  validate(state: Record<string, any>): boolean {
    try {
      // Check state version
      this.validateStateVersion(state);

      // Check network configuration
      this.validateNetworkConfiguration(state);

      // Check account configuration
      this.validateAccountConfiguration(state);

      // Check preferences
      this.validatePreferences(state);

      return true;
    } catch (error) {
      if (this.throwOnError) {
        throw error;
      }
      return false;
    }
  }

  private validateStateVersion(state: Record<string, any>): void {
    if (!state.meta?.version) {
      throw new StateValidationError('State version is missing');
    }

    if (state.meta.version !== STATE_METADATA_VERSION) {
      throw new StateValidationError(
        `State version mismatch. Expected ${STATE_METADATA_VERSION}, got ${state.meta.version}`,
      );
    }
  }

  private validateNetworkConfiguration(state: Record<string, any>): void {
    const networkController = state.NetworkController;
    if (!networkController) {
      throw new StateValidationError('NetworkController is missing');
    }

    // Check provider configuration
    if (!networkController.providerConfig) {
      throw new StateValidationError('Provider configuration is missing');
    }

    // Ensure network configurations are valid
    if (networkController.networkConfigurations) {
      Object.entries(networkController.networkConfigurations).forEach(
        ([id, config]: [string, any]) => {
          if (!config.chainId) {
            throw new StateValidationError(
              `Network configuration ${id} is missing chainId`,
            );
          }
          if (!config.rpcUrl) {
            throw new StateValidationError(
              `Network configuration ${id} is missing rpcUrl`,
            );
          }
        },
      );
    }
  }

  private validateAccountConfiguration(state: Record<string, any>): void {
    const accountsController = state.AccountsController;
    if (!accountsController?.internalAccounts?.accounts) {
      throw new StateValidationError('Account configuration is missing');
    }

    // Ensure selected account exists
    const selectedAccount = accountsController.internalAccounts.selectedAccount;
    if (selectedAccount) {
      const accounts = accountsController.internalAccounts.accounts;
      if (!accounts[selectedAccount]) {
        throw new StateValidationError(
          `Selected account ${selectedAccount} does not exist`,
        );
      }
    }

    // Validate each account has required fields
    Object.entries(accountsController.internalAccounts.accounts).forEach(
      ([id, account]: [string, any]) => {
        if (!account.address) {
          throw new StateValidationError(`Account ${id} is missing address`);
        }
        if (!account.metadata?.name) {
          throw new StateValidationError(`Account ${id} is missing name`);
        }
      },
    );
  }

  private validatePreferences(state: Record<string, any>): void {
    const preferencesController = state.PreferencesController;
    if (!preferencesController) {
      throw new StateValidationError('PreferencesController is missing');
    }

    // Validate identities match accounts
    const accountsController = state.AccountsController;
    if (accountsController?.internalAccounts?.accounts) {
      const accounts = accountsController.internalAccounts.accounts;
      const identities = preferencesController.identities || {};

      // Check all accounts have corresponding identities
      Object.values(accounts).forEach((account: any) => {
        const address = account.address.toLowerCase();
        if (!identities[address]) {
          throw new StateValidationError(
            `Missing identity for account ${address}`,
          );
        }
      });
    }

    // Validate essential preferences exist
    const requiredPreferences = [
      'useTokenDetection',
      'useNftDetection',
      'useCurrencyRateCheck',
    ];
    requiredPreferences.forEach((pref) => {
      if (typeof preferencesController[pref] !== 'boolean') {
        throw new StateValidationError(`Missing required preference: ${pref}`);
      }
    });
  }
}
