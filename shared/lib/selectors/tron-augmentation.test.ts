import { AssetsControllerState } from '@metamask/assets-controller';
import { CaipAssetType } from '@metamask/utils';
import { augmentTronResourceAssets } from './tron-augmentation';

const ACCOUNT_ID = 'account-1';

const ENERGY = 'tron:728126428/slip44:energy' as CaipAssetType;
const BANDWIDTH = 'tron:728126428/slip44:bandwidth' as CaipAssetType;
const STAKED_FOR_ENERGY =
  'tron:728126428/slip44:195-staked-for-energy' as CaipAssetType;
const NATIVE_TRX = 'tron:728126428/slip44:195' as CaipAssetType;
const USDT =
  'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' as CaipAssetType;
const NATIVE_ETH = 'eip155:1/slip44:60' as CaipAssetType;

const trxInfo = {
  type: 'native' as const,
  symbol: 'TRX',
  name: 'TRON',
  decimals: 6,
};

const buildState = (
  assetsInfo: AssetsControllerState['assetsInfo'],
  heldAssetIds: CaipAssetType[],
) =>
  ({
    assetsInfo,
    assetsBalance: {
      [ACCOUNT_ID]: Object.fromEntries(
        heldAssetIds.map((assetId) => [assetId, { amount: '1' }]),
      ),
    },
    assetsPrice: {},
  }) as unknown as AssetsControllerState;

describe('augmentTronResourceAssets', () => {
  it('adds metadata for held Tron resource assets', () => {
    const { assetsInfo } = augmentTronResourceAssets(
      buildState({ [NATIVE_TRX]: trxInfo }, [NATIVE_TRX, ENERGY, BANDWIDTH]),
    );

    expect(assetsInfo[ENERGY]).toStrictEqual({
      type: 'native',
      symbol: 'ENERGY',
      name: 'Energy',
      decimals: 0,
      image: expect.any(String),
    });
    expect(assetsInfo[BANDWIDTH]).toMatchObject({
      symbol: 'BANDWIDTH',
      decimals: 0,
    });
  });

  it('uses six decimals for staked TRX balances', () => {
    const { assetsInfo } = augmentTronResourceAssets(
      buildState({}, [STAKED_FOR_ENERGY]),
    );

    expect(assetsInfo[STAKED_FOR_ENERGY]).toMatchObject({
      symbol: 'sTRX-ENERGY',
      decimals: 6,
    });
  });

  it('leaves the rest of the state slice untouched', () => {
    const state = buildState({ [NATIVE_TRX]: trxInfo }, [NATIVE_TRX, ENERGY]);
    const result = augmentTronResourceAssets(state);

    expect(result.assetsInfo[NATIVE_TRX]).toBe(trxInfo);
    expect(result.assetsBalance).toBe(state.assetsBalance);
    expect(result.assetsPrice).toBe(state.assetsPrice);
  });

  it('does not override metadata the controller already persists', () => {
    const persistedEnergy = {
      type: 'native' as const,
      symbol: 'ENERGY-FROM-SNAP',
      name: 'Energy',
      decimals: 0,
    };

    const { assetsInfo } = augmentTronResourceAssets(
      buildState({ [ENERGY]: persistedEnergy }, [ENERGY]),
    );

    expect(assetsInfo[ENERGY]).toBe(persistedEnergy);
  });

  it('returns the input unchanged when there is nothing to add', () => {
    const state = buildState({ [NATIVE_TRX]: trxInfo }, [
      NATIVE_TRX,
      USDT,
      NATIVE_ETH,
    ]);

    expect(augmentTronResourceAssets(state)).toBe(state);
  });

  it('ignores resource-shaped asset IDs on non-Tron chains', () => {
    const { assetsInfo } = augmentTronResourceAssets(
      buildState({}, ['eip155:1/slip44:energy' as CaipAssetType]),
    );

    expect(assetsInfo).toStrictEqual({});
  });
});
