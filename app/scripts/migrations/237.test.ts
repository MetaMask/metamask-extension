import migrate, { version } from './237';

const ARC_ERC20_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';
const ACCOUNT_1 = 'account-1';
const ACCOUNT_2 = 'account-2';
const OTHER_ASSET_ID =
  'eip155:1/erc20:0x0000000000000000000000000000000000000abc';

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('removes the Arc ERC-20 USDC custom asset and keeps other custom assets', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        AssetsController: {
          customAssets: {
            [ACCOUNT_1]: [ARC_ERC20_USDC_ASSET_ID, OTHER_ASSET_ID],
          },
        },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(state, changedKeys);

    expect(state.data.AssetsController.customAssets).toStrictEqual({
      [ACCOUNT_1]: [OTHER_ASSET_ID],
    });
    expect(changedKeys).toStrictEqual(new Set(['AssetsController']));
  });

  it('removes accounts left with no custom assets', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        AssetsController: {
          customAssets: {
            [ACCOUNT_1]: [ARC_ERC20_USDC_ASSET_ID],
            [ACCOUNT_2]: [OTHER_ASSET_ID],
          },
        },
      },
    };
    await migrate(state, new Set());

    expect(state.data.AssetsController.customAssets).toStrictEqual({
      [ACCOUNT_2]: [OTHER_ASSET_ID],
    });
  });

  it('matches the asset id case-insensitively', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        AssetsController: {
          customAssets: {
            [ACCOUNT_1]: [
              'eip155:5042/erc20:0X3600000000000000000000000000000000000000',
            ],
          },
        },
      },
    };
    await migrate(state, new Set());

    expect(state.data.AssetsController.customAssets).toStrictEqual({});
  });

  it('is a no-op when the Arc ERC-20 USDC custom asset is absent', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        AssetsController: {
          customAssets: { [ACCOUNT_1]: [OTHER_ASSET_ID] },
        },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(state, changedKeys);

    expect(state.data.AssetsController.customAssets).toStrictEqual({
      [ACCOUNT_1]: [OTHER_ASSET_ID],
    });
    expect(changedKeys.size).toBe(0);
  });

  it('is a no-op when AssetsController is missing', async () => {
    const state = {
      meta: { version: version - 1 },
      data: { OtherController: { kept: true } },
    };
    const changedKeys = new Set<string>();
    await migrate(state, changedKeys);

    expect(state.data).toStrictEqual({ OtherController: { kept: true } });
    expect(changedKeys.size).toBe(0);
  });
});
