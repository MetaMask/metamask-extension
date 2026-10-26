import MetaMaskController from './metamask-controller';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'fake-extension-id',
    onInstalled: { addListener: () => undefined },
    onMessageExternal: { addListener: () => undefined },
    getPlatformInfo: async () => 'mac',
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('MetaMaskController.retrySnapBalances (v6: stale snap balances)', () => {
  const build = ({ assetsRetry, legacyUpdate }) => ({
    assetsController: { retrySnapBalances: assetsRetry },
    multichainBalancesController: { updateBalance: legacyUpdate },
  });

  it('retries the account in both the AssetsController and the legacy MultichainBalancesController', async () => {
    const assetsRetry = jest.fn().mockResolvedValue(undefined);
    const legacyUpdate = jest.fn().mockResolvedValue(undefined);
    const controller = build({ assetsRetry, legacyUpdate });

    await MetaMaskController.prototype.retrySnapBalances.call(controller, [
      'btc-account',
      'xlm-account',
    ]);

    expect(assetsRetry).toHaveBeenCalledWith(['btc-account', 'xlm-account']);
    // Each legacy update calls the snap's getAccountBalances, which schedules
    // a sync when the balance is stale.
    expect(legacyUpdate).toHaveBeenCalledWith('btc-account');
    expect(legacyUpdate).toHaveBeenCalledWith('xlm-account');
  });

  it('does not throw when a retry fails (the account stays unavailable)', async () => {
    const stale = new Error(
      'Account balance unavailable: synchronization has been failing since the last successful sync',
    );
    const controller = build({
      assetsRetry: jest.fn().mockRejectedValue(stale),
      legacyUpdate: jest.fn().mockRejectedValue(stale),
    });

    await expect(
      MetaMaskController.prototype.retrySnapBalances.call(controller, [
        'btc-account',
      ]),
    ).resolves.toBeUndefined();
  });
});
