import { Hex } from '@metamask/utils';
import type { DeleGatorEnvironment } from '..';
import { specificActionERC20TransferBatchBuilder } from './specificActionERC20TransferBatchBuilder';

const mockEnvironment: DeleGatorEnvironment = {
  DelegationManager: '0x1234567890123456789012345678901234567890',
  EntryPoint: '0x2345678901234567890123456789012345678901',
  SimpleFactory: '0x3456789012345678901234567890123456789012',
  EIP7702StatelessDeleGatorImpl: '0x1234567890123456789012345678901234567890',
  implementations: {
    MultiSigDeleGatorImpl: '0x4567890123456789012345678901234567890123',
    HybridDeleGatorImpl: '0x5678901234567890123456789012345678901234',
  },
  caveatEnforcers: {
    LimitedCallsEnforcer: '0x1234567890123456789012345678901234567890',
    SpecificActionERC20TransferBatchEnforcer:
      '0x7890123456789012345678901234567890123456',
  },
};

describe('specificActionERC20TransferBatchBuilder', () => {
  const testTokenAddress = `0x${'1'.repeat(40)}` as Hex;
  const testRecipient = `0x${'2'.repeat(40)}` as Hex;
  const testAmount = `0x${BigInt(10 * 10 ** 9).toString(16)}` as Hex;
  const testFirstTarget = `0x${'3'.repeat(40)}` as Hex;
  const testFirstValue = `0x${BigInt(10 ** 9).toString(16)}` as Hex;
  const testFirstCalldata = `0x${'4'.repeat(40)}` as Hex;

  it('should create a caveat with a valid specific action ERC20 transfer batch', () => {
    const caveat = specificActionERC20TransferBatchBuilder(
      mockEnvironment,
      testTokenAddress,
      testRecipient,
      testAmount,
      testFirstTarget,
      testFirstValue,
      testFirstCalldata,
    );

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.SpecificActionERC20TransferBatchEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
    const endOfTokenAddress = 42;
    expect(caveat.terms.slice(0, endOfTokenAddress)).toStrictEqual(
      testTokenAddress,
    );
    const endOfRecipient = endOfTokenAddress + 40; // excludes 2 leading 0x characters
    expect(caveat.terms.slice(endOfTokenAddress, endOfRecipient)).toStrictEqual(
      testRecipient.slice(2),
    );
    // the the zero-padded amount is encoded from endOfRecipient to endOfRecipient + 64
    const endOfAmount = endOfRecipient + 64;
    const endOfFirstTarget = endOfAmount + 40; // excludes 2 leading 0x characters
    expect(caveat.terms.slice(endOfAmount, endOfFirstTarget)).toStrictEqual(
      testFirstTarget.slice(2),
    );
    const endOfFirstValue = endOfFirstTarget + 64;
    expect(caveat.terms.slice(endOfFirstTarget, endOfFirstValue)).toStrictEqual(
      testFirstValue.slice(2).padStart(64, '0'),
    );
    expect(caveat.terms.slice(endOfFirstValue)).toStrictEqual(
      testFirstCalldata.slice(2),
    ); // 0x removed from the appended data
  });

  it('should throw an error if token address is not an address', () => {
    const testTokenAddressOverride = `${testTokenAddress}12345` as Hex; // longer than 42 chars

    expect(() => {
      specificActionERC20TransferBatchBuilder(
        mockEnvironment,
        testTokenAddressOverride,
        testRecipient,
        testAmount,
        testFirstTarget,
        testFirstValue,
        testFirstCalldata,
      );
    }).toThrow('Invalid tokenAddress: must be a valid address');
  });

  it('should throw an error if recipient is not an address', () => {
    const testRecipientOverride = `${testRecipient}12345` as Hex; // longer than 42 chars

    expect(() => {
      specificActionERC20TransferBatchBuilder(
        mockEnvironment,
        testTokenAddress,
        testRecipientOverride,
        testAmount,
        testFirstTarget,
        testFirstValue,
        testFirstCalldata,
      );
    }).toThrow('Invalid recipient: must be a valid address');
  });

  it('should throw an error if amount is not positive', () => {
    const testAmountOverride = '-0x012123' as Hex; // negative value

    expect(() => {
      specificActionERC20TransferBatchBuilder(
        mockEnvironment,
        testTokenAddress,
        testRecipient,
        testAmountOverride,
        testFirstTarget,
        testFirstValue,
        testFirstCalldata,
      );
    }).toThrow('Invalid amount: must be a positive integer or zero');
  });

  it('should throw an error if first target is not an address', () => {
    const testFirstTargetOverride = `${testFirstTarget}12345` as Hex; // longer than 42 chars

    expect(() => {
      specificActionERC20TransferBatchBuilder(
        mockEnvironment,
        testTokenAddress,
        testRecipient,
        testAmount,
        testFirstTargetOverride,
        testFirstValue,
        testFirstCalldata,
      );
    }).toThrow('Invalid firstTarget: must be a valid address');
  });

  it('should throw an error if first value is not positive', () => {
    const testFirstValueOverride = '-0x012123' as Hex; // negative value

    expect(() => {
      specificActionERC20TransferBatchBuilder(
        mockEnvironment,
        testTokenAddress,
        testRecipient,
        testAmount,
        testFirstTarget,
        testFirstValueOverride,
        testFirstCalldata,
      );
    }).toThrow('Invalid firstValue: must be a positive integer or zero');
  });

  it('should allow empty calldata', () => {
    const caveat = specificActionERC20TransferBatchBuilder(
      mockEnvironment,
      testTokenAddress,
      testRecipient,
      testAmount,
      testFirstTarget,
      testFirstValue,
      undefined,
    );

    const endOfFirstValue = 42 + 40 + 64 + 40 + 64;
    expect(caveat.terms.slice(endOfFirstValue)).toBe('');
  });

  // remaining failure modes should be avoided by respecting the types
});
