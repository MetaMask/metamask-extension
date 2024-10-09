import { TransactionMeta } from '@metamask/transaction-controller';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
// import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { useTokenTracker } from '../../../../../../hooks/useTokenTracker';
import { useTokenValues } from './use-token-values';

jest.mock(
  '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate',
  () => jest.fn(),
);

jest.mock('../../../../../../hooks/useTokenTracker', () => ({
  ...jest.requireActual('../../../../../../hooks/useTokenTracker'),
  useTokenTracker: jest.fn(),
}));

describe('useTokenValues', () => {
  const useTokenExchangeRateMock = jest.mocked(useTokenExchangeRate);
  const useTokenTrackerMock = jest.mocked(useTokenTracker);

  const TEST_SELECTED_TOKEN = {
    address: 'address',
    decimals: 18,
    symbol: 'symbol',
    iconUrl: 'iconUrl',
    image: 'image',
  };

  it('returns native and fiat balances', async () => {
    (useTokenTrackerMock as jest.Mock).mockResolvedValue({
      tokensWithBalances: [
        {
          address: '0x076146c765189d51be3160a2140cf80bfc73ad68',
          balance: '1000000000000000000',
          decimals: 18,
        },
      ],
    });

    (useTokenExchangeRateMock as jest.Mock).mockResolvedValue(
      new Numeric(1, 10),
    );

    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useTokenValues(transactionMeta, TEST_SELECTED_TOKEN),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      fiatDisplayValue: '$1.00',
      tokenBalance: '1',
    });
  });

  it('returns undefined native and fiat balances if no token with balances is returned', async () => {
    (useTokenTrackerMock as jest.Mock).mockResolvedValue({
      tokensWithBalances: [],
    });

    (useTokenExchangeRateMock as jest.Mock).mockResolvedValue(
      new Numeric(1, 10),
    );

    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useTokenValues(transactionMeta, TEST_SELECTED_TOKEN),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      fiatDisplayValue: undefined,
      tokenBalance: undefined,
    });
  });

  it('returns undefined fiat balance if no token rate is returned', async () => {
    (useTokenTrackerMock as jest.Mock).mockResolvedValue({
      tokensWithBalances: [
        {
          address: '0x076146c765189d51be3160a2140cf80bfc73ad68',
          balance: '1000000000000000000',
          decimals: 18,
        },
      ],
    });

    (useTokenExchangeRateMock as jest.Mock).mockResolvedValue(null);

    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useTokenValues(transactionMeta, TEST_SELECTED_TOKEN),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      fiatDisplayValue: null,
      tokenBalance: '1',
    });
  });
});
