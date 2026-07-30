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
  ...jest.requireActual('../../../selectors/stellar-assets'),
  getSpendableForAccount: jest.fn(),
}));

const STELLAR_NATIVE_ASSET_ID =
  `${XlmScope.Pubnet}/slip44:148` as CaipAssetType;

describe('useSpendableBalance', () => {
  const getSpendableForAccountMock =
    stellarAssetsSelectors.getSpendableForAccount as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns spendable balance data for supported native assets', () => {
    getSpendableForAccountMock.mockReturnValue({
      minimumReserveBalance: '2.5',
      spendableBalance: '247.5',
    });

    const { result } = renderHook(() =>
      useSpendableBalance({
        assetId: STELLAR_NATIVE_ASSET_ID,
      }),
    );

    expect(getSpendableForAccountMock).toHaveBeenCalledWith(
      {},
      { assetId: STELLAR_NATIVE_ASSET_ID },
    );
    expect(result.current).toStrictEqual({
      hasSpendableBalance: true,
      minimumReserveBalance: '2.5',
      spendableBalance: '247.5',
    });
  });

  it('returns hasSpendableBalance false when spendable info is unavailable', () => {
    getSpendableForAccountMock.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useSpendableBalance({
        assetId: STELLAR_NATIVE_ASSET_ID,
      }),
    );

    expect(result.current).toStrictEqual({
      hasSpendableBalance: false,
      minimumReserveBalance: undefined,
      spendableBalance: undefined,
    });
  });

  it('returns hasSpendableBalance false for assets that do not support spendable balance', () => {
    getSpendableForAccountMock.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useSpendableBalance({
        assetId: 'eip155:1/slip44:60',
      }),
    );

    expect(getSpendableForAccountMock).toHaveBeenCalledWith(
      {},
      { assetId: 'eip155:1/slip44:60' },
    );
    expect(result.current).toStrictEqual({
      hasSpendableBalance: false,
      minimumReserveBalance: undefined,
      spendableBalance: undefined,
    });
  });

  it('returns hasSpendableBalance true when spendable balance is zero', () => {
    getSpendableForAccountMock.mockReturnValue({
      minimumReserveBalance: '1',
      spendableBalance: '0',
    });

    const { result } = renderHook(() =>
      useSpendableBalance({
        assetId: STELLAR_NATIVE_ASSET_ID,
      }),
    );

    expect(result.current).toStrictEqual({
      hasSpendableBalance: true,
      minimumReserveBalance: '1',
      spendableBalance: '0',
    });
  });
});
