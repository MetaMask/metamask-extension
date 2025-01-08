import {
  StateValidator,
  StateValidationError,
  STATE_METADATA_VERSION,
} from './state-validator';

describe('StateValidator', () => {
  let validator: StateValidator;
  let validState: Record<string, any>;

  beforeEach(() => {
    validator = new StateValidator();
    validState = {
      meta: {
        version: STATE_METADATA_VERSION,
      },
      NetworkController: {
        providerConfig: {
          type: 'mainnet',
          chainId: '0x1',
        },
        networkConfigurations: {
          'network-1': {
            chainId: '0x1',
            rpcUrl: 'https://mainnet.infura.io/v3/test',
          },
        },
      },
      AccountsController: {
        internalAccounts: {
          selectedAccount: 'account-1',
          accounts: {
            'account-1': {
              address: '0x123',
              metadata: {
                name: 'Account 1',
              },
            },
          },
        },
      },
      PreferencesController: {
        identities: {
          '0x123': {
            name: 'Account 1',
            address: '0x123',
          },
        },
        useTokenDetection: true,
        useNftDetection: false,
        useCurrencyRateCheck: true,
      },
    };
  });

  describe('validate', () => {
    it('should validate a correct state', () => {
      expect(() => validator.validate(validState)).not.toThrow();
      expect(validator.validate(validState)).toBe(true);
    });

    it('should return false instead of throwing when throwOnError is false', () => {
      validator = new StateValidator({ throwOnError: false });
      const invalidState = { ...validState, meta: { version: 0 } };
      expect(validator.validate(invalidState)).toBe(false);
    });
  });

  describe('validateStateVersion', () => {
    it('should throw if state version is missing', () => {
      const invalidState = { ...validState, meta: {} };
      expect(() => validator.validate(invalidState)).toThrow(
        StateValidationError,
      );
      expect(() => validator.validate(invalidState)).toThrow(
        'State version is missing',
      );
    });

    it('should throw if state version does not match', () => {
      const invalidState = {
        ...validState,
        meta: { version: STATE_METADATA_VERSION - 1 },
      };
      expect(() => validator.validate(invalidState)).toThrow(
        StateValidationError,
      );
      expect(() => validator.validate(invalidState)).toThrow(
        /State version mismatch/u,
      );
    });
  });

  describe('validateNetworkConfiguration', () => {
    it('should throw if NetworkController is missing', () => {
      const { NetworkController, ...invalidState } = validState;
      expect(() => validator.validate(invalidState)).toThrow(
        'NetworkController is missing',
      );
    });

    it('should throw if provider configuration is missing', () => {
      const invalidState = {
        ...validState,
        NetworkController: {
          ...validState.NetworkController,
          providerConfig: null,
        },
      };
      expect(() => validator.validate(invalidState)).toThrow(
        'Provider configuration is missing',
      );
    });

    it('should throw if network configuration is invalid', () => {
      const invalidState = {
        ...validState,
        NetworkController: {
          ...validState.NetworkController,
          networkConfigurations: {
            'network-1': { chainId: null, rpcUrl: null },
          },
        },
      };
      expect(() => validator.validate(invalidState)).toThrow(
        /missing chainId/u,
      );
    });
  });

  describe('validateAccountConfiguration', () => {
    it('should throw if account configuration is missing', () => {
      const { AccountsController, ...invalidState } = validState;
      expect(() => validator.validate(invalidState)).toThrow(
        'Account configuration is missing',
      );
    });

    it('should throw if selected account does not exist', () => {
      const invalidState = {
        ...validState,
        AccountsController: {
          ...validState.AccountsController,
          internalAccounts: {
            ...validState.AccountsController.internalAccounts,
            selectedAccount: 'non-existent',
          },
        },
      };
      expect(() => validator.validate(invalidState)).toThrow(
        /Selected account.*does not exist/u,
      );
    });

    it('should throw if account is missing required fields', () => {
      const invalidState = {
        ...validState,
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'account-1',
            accounts: {
              'account-1': { metadata: {} },
            },
          },
        },
      };
      expect(() => validator.validate(invalidState)).toThrow(
        /Account.*is missing address/u,
      );
    });
  });

  describe('validatePreferences', () => {
    it('should throw if PreferencesController is missing', () => {
      const { PreferencesController, ...invalidState } = validState;
      expect(() => validator.validate(invalidState)).toThrow(
        'PreferencesController is missing',
      );
    });

    it('should throw if identity is missing for account', () => {
      const invalidState = {
        ...validState,
        PreferencesController: {
          ...validState.PreferencesController,
          identities: {},
        },
      };
      expect(() => validator.validate(invalidState)).toThrow(
        /Missing identity for account/u,
      );
    });

    it('should throw if required preferences are missing', () => {
      const invalidState = {
        ...validState,
        PreferencesController: {
          ...validState.PreferencesController,
          useTokenDetection: undefined,
        },
      };
      expect(() => validator.validate(invalidState)).toThrow(
        /Missing required preference/u,
      );
    });
  });
});
