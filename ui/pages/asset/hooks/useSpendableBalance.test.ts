import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import { renderHook } from '@testing-library/react-hooks';

import * as stellarAssetsSelectors from '../../../selectors/stellar-assets';
import { useSpendableBalance } from './useSpendableBalance';

jest.mock('react-redux', () => ({
  useSelector: <State, Result>(selector: (state: State) => Result): Result =>
    selector({} as State),
}));

jest.mock('../../../selectors/stellar-assets', () => ({
  getStellarBaseReserveForAccountAsset: jest.fn(),
}));

const ACCOUNT_ID = 'stellar-account-id';
const STELLAR_NATIVE_ASSET_ID =
  `${XlmScope.Pubnet}/slip44:148` as CaipAssetType;

describe('useSpendableBalance', () => {
  const getStellarBaseReserveForAccountAssetMock =
    stellarAssetsSelectors.getStellarBaseReserveForAccountAsset as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns spendable balance data for supported native assets', () => {
    getStellarBaseReserveForAccountAssetMock.mockReturnValue('2.5');

    const { result } = renderHook(() =>
      useSpendableBalance({
        accountId: ACCOUNT_ID,
        assetId: STELLAR_NATIVE_ASSET_ID,
        totalBalance: '250',
      }),
    );

    expect(result.current).toStrictEqual({
      baseReserve: '2.5',
      spendableBalance: '247.5',
    });
  });

  it('returns undefined values when base reserve is unsupported', () => {
    getStellarBaseReserveForAccountAssetMock.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useSpendableBalance({
        accountId: ACCOUNT_ID,
        assetId: STELLAR_NATIVE_ASSET_ID,
        totalBalance: '250',
      }),
    );

    expect(result.current).toStrictEqual({
      baseReserve: undefined,
      spendableBalance: undefined,
    });
  });

  it('skips selector lookup when account id or asset id is missing', () => {
    const { result } = renderHook(() =>
      useSpendableBalance({
        accountId: undefined,
        assetId: undefined,
        totalBalance: '250',
      }),
    );

    expect(getStellarBaseReserveForAccountAssetMock).not.toHaveBeenCalled();
    expect(result.current).toStrictEqual({
      baseReserve: undefined,
      spendableBalance: undefined,
    });
  });

  it('skips selector lookup for assets that do not support base reserve', () => {
    const { result } = renderHook(() =>
      useSpendableBalance({
        accountId: ACCOUNT_ID,
        assetId: 'eip155:1/slip44:60' as CaipAssetType,
        totalBalance: '250',
      }),
    );

    expect(getStellarBaseReserveForAccountAssetMock).not.toHaveBeenCalled();
    expect(result.current).toStrictEqual({
      baseReserve: undefined,
      spendableBalance: undefined,
    });
  });
});
