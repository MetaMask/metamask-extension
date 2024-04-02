import { applyFeeToTransaction } from './smart-transactions';

describe('applyFeeToTransaction', () => {
  it('should apply fee to transaction', () => {
    const txParams = {
      from: '0x1234567890abcdef',
      to: '0xabcdef1234567890',
      gas: '0x5208',
    };
    const fee = {
      maxFeePerGas: 1000000000,
      maxPriorityFeePerGas: 500000000,
    };
    const isCancel = false;
    const expectedTransaction = {
      from: '0x1234567890abcdef',
      to: '0xabcdef1234567890',
      gas: '0x5208',
      maxFeePerGas: '0x3b9aca00',
      maxPriorityFeePerGas: '0x1dcd6500',
    };
    const result = applyFeeToTransaction(txParams, fee, isCancel);
    expect(result).toEqual(expectedTransaction);
  });

  it('should apply fee to cancel transaction', () => {
    const txParams = {
      from: '0x1234567890abcdef',
      to: '0xabcdef1234567890',
      gas: '0x5208',
    };
    const fee = {
      maxFeePerGas: 1000000000,
      maxPriorityFeePerGas: 500000000,
    };
    const isCancel = true;
    const expectedTransaction = {
      from: '0x1234567890abcdef',
      to: '0x1234567890abcdef',
      gas: '0x5208',
      maxFeePerGas: '0x3b9aca00',
      maxPriorityFeePerGas: '0x1dcd6500',
      data: '0x',
    };
    const result = applyFeeToTransaction(txParams, fee, isCancel);
    expect(result).toEqual(expectedTransaction);
  });
});
