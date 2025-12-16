import {
  validateGas,
  validatePriorityFee,
  validateMaxBaseFee,
  validateGasPrice,
} from './gasValidations';

const mockT = ((key: string, args?: string | string[]) => {
  const translations: Record<string, string> = {
    gasLimit: 'Gas Limit',
    priorityFee: 'Priority Fee',
    maxBaseFee: 'Max Base Fee',
    gasPrice: 'Gas price',
    onlyNumbersAllowed: 'Only numbers are allowed',
    onlyIntegersAllowed: 'Only whole numbers are allowed',
    gasLimitTooLow: 'Gas limit must be at least 21000',
    priorityFeeTooHigh: 'Priority fee must be less than max base fee',
    maxBaseFeeMustBeGreaterThanPriorityFee:
      'Max base fee must be greater than priority fee',
    negativeValuesNotAllowed: 'Negative values are not allowed',
  };

  if (key === 'fieldRequired' && Array.isArray(args)) {
    return `${args[0]} is required`;
  }

  if (key === 'noZeroValue' && args) {
    const field = Array.isArray(args) ? args[0] : args;
    return `${field} must be greater than 0`;
  }

  return translations[key] || key;
}) as ReturnType<typeof import('../../../hooks/useI18nContext').useI18nContext>;

describe('gas-validations', () => {
  describe('validateGas', () => {
    it('return error message when gas is empty', () => {
      expect(validateGas('', mockT)).toBe('Gas Limit is required');
    });

    it('return error message when gas is not a number', () => {
      expect(validateGas('abc', mockT)).toBe('Only numbers are allowed');
    });

    it('return error message when gas is a lone decimal point', () => {
      expect(validateGas('.', mockT)).toBe('Only numbers are allowed');
    });

    it('return error message when gas is zero', () => {
      expect(validateGas('0', mockT)).toBe('Gas Limit must be greater than 0');
    });

    it('return error message when gas is negative', () => {
      expect(validateGas('-1', mockT)).toBe('Only numbers are allowed');
    });

    it('return error message when gas is less than 21000', () => {
      expect(validateGas('20000', mockT)).toBe(
        'Gas limit must be at least 21000',
      );
    });

    it('return error message when gas is not an integer', () => {
      expect(validateGas('21000.5', mockT)).toBe(
        'Only whole numbers are allowed',
      );
    });

    it('return undefined when gas is valid', () => {
      expect(validateGas('21000', mockT)).toBeUndefined();
      expect(validateGas('30000', mockT)).toBeUndefined();
    });
  });

  describe('validatePriorityFee', () => {
    it('return error message when priority fee is empty', () => {
      expect(validatePriorityFee('', '10', mockT)).toBe(
        'Priority Fee is required',
      );
    });

    it('return error message when priority fee is not a number', () => {
      expect(validatePriorityFee('abc', '10', mockT)).toBe(
        'Only numbers are allowed',
      );
    });

    it('return error message when priority fee is a lone decimal point', () => {
      expect(validatePriorityFee('.', '10', mockT)).toBe(
        'Only numbers are allowed',
      );
    });

    it('return error message when priority fee is zero', () => {
      expect(validatePriorityFee('0', '10', mockT)).toBe(
        'Priority Fee must be greater than 0',
      );
    });

    it('return error message when priority fee is negative', () => {
      expect(validatePriorityFee('-1', '10', mockT)).toBe(
        'Only numbers are allowed',
      );
    });

    it('return error message when priority fee is greater than max fee', () => {
      expect(validatePriorityFee('15', '10', mockT)).toBe(
        'Priority fee must be less than max base fee',
      );
    });

    it('return undefined when priority fee is valid', () => {
      expect(validatePriorityFee('5', '10', mockT)).toBeUndefined();
      expect(validatePriorityFee('10', '10', mockT)).toBeUndefined();
      expect(validatePriorityFee('10.5', '10.5', mockT)).toBeUndefined();
    });
  });

  describe('validateMaxBaseFee', () => {
    it('return error message when max base fee is empty', () => {
      expect(validateMaxBaseFee('', '5', mockT)).toBe(
        'Max Base Fee is required',
      );
    });

    it('return error message when max base fee is not a number', () => {
      expect(validateMaxBaseFee('abc', '5', mockT)).toBe(
        'Only numbers are allowed',
      );
    });

    it('return error message when max base fee is a lone decimal point', () => {
      expect(validateMaxBaseFee('.', '5', mockT)).toBe(
        'Only numbers are allowed',
      );
    });

    it('return error message when max base fee is zero', () => {
      expect(validateMaxBaseFee('0', '5', mockT)).toBe(
        'Max Base Fee must be greater than 0',
      );
    });

    it('return error message when max base fee is negative', () => {
      expect(validateMaxBaseFee('-1', '5', mockT)).toBe(
        'Only numbers are allowed',
      );
    });

    it('return error message when max base fee is less than max priority fee', () => {
      expect(validateMaxBaseFee('3', '5', mockT)).toBe(
        'Max base fee must be greater than priority fee',
      );
    });

    it('return undefined when max base fee is valid', () => {
      expect(validateMaxBaseFee('6', '5', mockT)).toBeUndefined();
      expect(validateMaxBaseFee('10', '5', mockT)).toBeUndefined();
      expect(validateMaxBaseFee('10.5', '5', mockT)).toBeUndefined();
    });
  });

  describe('validateGasPrice', () => {
    it('return error message when gas price is empty', () => {
      expect(validateGasPrice('', mockT)).toBe('Gas price is required');
    });

    it('return error message when gas price is not a number', () => {
      expect(validateGasPrice('abc', mockT)).toBe('Only numbers are allowed');
    });

    it('return error message when gas price is a lone decimal point', () => {
      expect(validateGasPrice('.', mockT)).toBe('Only numbers are allowed');
    });

    it('return error message when gas price is zero', () => {
      expect(validateGasPrice('0', mockT)).toBe(
        'Gas price must be greater than 0',
      );
    });

    it('return error message when gas price is negative', () => {
      expect(validateGasPrice('-1', mockT)).toBe('Only numbers are allowed');
    });

    it('return undefined when gas price is valid', () => {
      expect(validateGasPrice('1', mockT)).toBeUndefined();
      expect(validateGasPrice('10.5', mockT)).toBeUndefined();
      expect(validateGasPrice('.5', mockT)).toBeUndefined();
      expect(validateGasPrice('5.', mockT)).toBeUndefined();
    });
  });
});
