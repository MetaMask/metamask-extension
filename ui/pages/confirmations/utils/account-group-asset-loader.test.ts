import {
  ACCOUNT_GROUP_ASSET_FETCH_TIMEOUT_MS,
  hasRequestedAccountGroupAssets,
  isAccountGroupAssetLoadPending,
  resetAccountGroupAssetLoaderForTests,
  runAccountGroupAssetLoad,
  subscribeToAccountGroupAssetLoads,
} from './account-group-asset-loader';

describe('account-group-asset-loader', () => {
  beforeEach(() => {
    jest.useRealTimers();
    resetAccountGroupAssetLoaderForTests();
  });

  afterEach(() => {
    resetAccountGroupAssetLoaderForTests();
  });

  it('marks groups pending while fetch runs and clears on settle', async () => {
    let resolveLoad: (() => void) | undefined;
    const loadAssets = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const listener = jest.fn();
    const unsubscribe = subscribeToAccountGroupAssetLoads(listener);

    const loadPromise = runAccountGroupAssetLoad(['group-1'], loadAssets);

    expect(isAccountGroupAssetLoadPending('group-1')).toBe(true);
    expect(hasRequestedAccountGroupAssets('group-1')).toBe(true);
    expect(listener).toHaveBeenCalled();

    await Promise.resolve();
    expect(loadAssets).toHaveBeenCalledTimes(1);

    resolveLoad?.();
    await loadPromise;

    expect(isAccountGroupAssetLoadPending('group-1')).toBe(false);
    expect(hasRequestedAccountGroupAssets('group-1')).toBe(true);

    unsubscribe();
  });

  it('skips groups that were already requested this session', async () => {
    const loadAssets = jest.fn().mockResolvedValue(undefined);

    await runAccountGroupAssetLoad(['group-1'], loadAssets);
    loadAssets.mockClear();

    await runAccountGroupAssetLoad(['group-1'], loadAssets);

    expect(loadAssets).not.toHaveBeenCalled();
  });

  it('allows retry after a failed fetch', async () => {
    const failingLoad = jest.fn().mockRejectedValue(new Error('boom'));
    await runAccountGroupAssetLoad(['group-1'], failingLoad);

    expect(hasRequestedAccountGroupAssets('group-1')).toBe(false);

    const succeedingLoad = jest.fn().mockResolvedValue(undefined);
    await runAccountGroupAssetLoad(['group-1'], succeedingLoad);

    expect(succeedingLoad).toHaveBeenCalledTimes(1);
    expect(hasRequestedAccountGroupAssets('group-1')).toBe(true);
  });

  it('clears pending after timeout without cancelling the fetch', async () => {
    jest.useFakeTimers();
    let resolveLoad: (() => void) | undefined;
    const loadAssets = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const loadPromise = runAccountGroupAssetLoad(['group-1'], loadAssets);

    expect(isAccountGroupAssetLoadPending('group-1')).toBe(true);

    await Promise.resolve();
    expect(loadAssets).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(ACCOUNT_GROUP_ASSET_FETCH_TIMEOUT_MS);

    expect(isAccountGroupAssetLoadPending('group-1')).toBe(false);
    expect(hasRequestedAccountGroupAssets('group-1')).toBe(true);

    resolveLoad?.();
    await loadPromise;
  });
});
