import {
  StateValidator,
  StateValidationError,
  StateValidatorState,
  STATE_METADATA_VERSION,
} from './state-validator';

describe('StateValidator', () => {
  let validator: StateValidator;

  beforeEach(() => {
    validator = new StateValidator();
  });

  describe('validateState', () => {
    const validState: StateValidatorState = {
      version: STATE_METADATA_VERSION,
      networkConfiguration: {
        chainId: '0x1',
        rpcUrl: 'https://mainnet.infura.io/v3/',
        ticker: 'ETH',
      },
      accountConfiguration: {
        address: '0x123',
        type: 'hardware',
      },
      preferences: {
        privacyMode: true,
        showTestNetworks: false,
      },
    };

    it('should validate a correct state without throwing', () => {
      expect(() => validator.validateState(validState)).not.toThrow();
    });

    it('should throw when version is incorrect', () => {
      const invalidState = {
        ...validState,
        version: STATE_METADATA_VERSION - 1,
      };
      expect(() => validator.validateState(invalidState)).toThrow(
        StateValidationError,
      );
    });

    it('should throw when network configuration is invalid', () => {
      const invalidState = {
        ...validState,
        networkConfiguration: {
          ...validState.networkConfiguration,
          chainId: '',
        },
      };
      expect(() => validator.validateState(invalidState)).toThrow(
        StateValidationError,
      );
    });

    it('should throw when account configuration is invalid', () => {
      const invalidState = {
        ...validState,
        accountConfiguration: {
          ...validState.accountConfiguration,
          address: '',
        },
      };
      expect(() => validator.validateState(invalidState)).toThrow(
        StateValidationError,
      );
    });

    it('should throw when preferences are invalid', () => {
      const invalidState = {
        ...validState,
        preferences: {
          ...validState.preferences,
          privacyMode: undefined as unknown as boolean,
        },
      };
      expect(() => validator.validateState(invalidState)).toThrow(
        StateValidationError,
      );
    });
  });
});
