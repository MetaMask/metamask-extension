import { shouldUseSmartTransactionsForQuote } from './should-use-smart-transactions-for-quote';

describe('shouldUseSmartTransactionsForQuote', () => {
  it('returns false when STX is disabled', () => {
    expect(
      shouldUseSmartTransactionsForQuote({
        isStxEnabled: false,
        isHardwareWallet: false,
        quoteResponse: { approval: { data: '0x' } },
      }),
    ).toBe(false);
  });

  it('returns true for software wallets with approval when STX is enabled', () => {
    expect(
      shouldUseSmartTransactionsForQuote({
        isStxEnabled: true,
        isHardwareWallet: false,
        quoteResponse: { approval: { data: '0x' } },
      }),
    ).toBe(true);
  });

  it('returns true for hardware wallets without approval when STX is enabled', () => {
    expect(
      shouldUseSmartTransactionsForQuote({
        isStxEnabled: true,
        isHardwareWallet: true,
        quoteResponse: {},
      }),
    ).toBe(true);
  });

  it('returns false for hardware wallets with approval when STX is enabled', () => {
    expect(
      shouldUseSmartTransactionsForQuote({
        isStxEnabled: true,
        isHardwareWallet: true,
        quoteResponse: { approval: { data: '0x' } },
      }),
    ).toBe(false);
  });

  it('returns false for hardware wallets with resetApproval when STX is enabled', () => {
    expect(
      shouldUseSmartTransactionsForQuote({
        isStxEnabled: true,
        isHardwareWallet: true,
        quoteResponse: { resetApproval: { data: '0x' } },
      }),
    ).toBe(false);
  });
});
