import { cloneDeep } from 'lodash';
import { migrate, version } from './229';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

const ARC_ERC20_USDC =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';
const ARC_ERC20_USDC_UPPER =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000'.toUpperCase();
const ARC_NATIVE = 'eip155:5042/slip44:5042';
const DAI = 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F';
const ACCOUNT_1 = 'account-1';
const ACCOUNT_2 = 'account-2';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('does nothing when AssetsController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when the Arc ERC-20 pin is not present', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AssetsController: {
          customAssets: { [ACCOUNT_1]: [DAI] },
          assetsBalance: { [ACCOUNT_1]: { [DAI]: { amount: '1' } } },
          assetsInfo: { [DAI]: { symbol: 'DAI' } },
          assetPreferences: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('removes the Arc ERC-20 pin from customAssets, balances, metadata, and preferences', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AssetsController: {
          customAssets: {
            [ACCOUNT_1]: [DAI, ARC_ERC20_USDC],
            [ACCOUNT_2]: [ARC_ERC20_USDC],
          },
          assetsBalance: {
            [ACCOUNT_1]: {
              [DAI]: { amount: '1' },
              [ARC_ERC20_USDC]: { amount: '0' },
              [ARC_NATIVE]: { amount: '10' },
            },
          },
          assetsInfo: {
            [DAI]: { symbol: 'DAI' },
            [ARC_ERC20_USDC]: { symbol: 'USDC' },
            [ARC_NATIVE]: { symbol: 'USDC' },
          },
          assetPreferences: {
            [ARC_ERC20_USDC]: { hidden: false },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.AssetsController).toStrictEqual({
      customAssets: {
        [ACCOUNT_1]: [DAI],
      },
      assetsBalance: {
        [ACCOUNT_1]: {
          [DAI]: { amount: '1' },
          [ARC_NATIVE]: { amount: '10' },
        },
      },
      assetsInfo: {
        [DAI]: { symbol: 'DAI' },
        [ARC_NATIVE]: { symbol: 'USDC' },
      },
      assetPreferences: {},
    });
    expect(changedControllers.has('AssetsController')).toBe(true);
  });

  it('matches the Arc ERC-20 asset id case-insensitively', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AssetsController: {
          customAssets: { [ACCOUNT_1]: [ARC_ERC20_USDC_UPPER] },
          assetsBalance: {
            [ACCOUNT_1]: { [ARC_ERC20_USDC_UPPER]: { amount: '0' } },
          },
          assetsInfo: { [ARC_ERC20_USDC_UPPER]: { symbol: 'USDC' } },
          assetPreferences: { [ARC_ERC20_USDC_UPPER]: { hidden: true } },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.AssetsController).toStrictEqual({
      customAssets: {},
      assetsBalance: { [ACCOUNT_1]: {} },
      assetsInfo: {},
      assetPreferences: {},
    });
    expect(changedControllers.has('AssetsController')).toBe(true);
  });
});
