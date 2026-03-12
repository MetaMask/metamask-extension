import { getTransactionToastContent } from './transaction-toast-content';

describe('getTransactionToastContent', () => {
  it('returns submitted title for pending variant', () => {
    const result = getTransactionToastContent('pending');
    expect(result.title).toBe('Transaction submitted');
    expect(result.description).toBe('');
  });

  it('returns confirmed title for success variant', () => {
    const result = getTransactionToastContent('success');
    expect(result.title).toBe('Transaction confirmed');
    expect(result.description).toBe('');
  });

  it('returns failed title for failed variant', () => {
    const result = getTransactionToastContent('failed');
    expect(result.title).toBe('Transaction failed');
    expect(result.description).toBe('');
  });
});
