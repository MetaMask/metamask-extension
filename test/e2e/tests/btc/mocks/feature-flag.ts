// Feature flags for Bitcoin testing (shared with bridge mocks for swap tests)
export const BITCOIN_FEATURE_FLAGS = {
  sendRedesign: {
    enabled: true,
  },
  bitcoinAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
};
