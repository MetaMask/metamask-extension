import { TransactionMeta } from '@metamask/transaction-controller';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { useTokenValues } from './use-token-values';
import { useDecodedTransactionData } from './useDecodedTransactionData';

jest.mock('../../../../hooks/useAssetDetails', () => ({
  ...jest.requireActual('../../../../hooks/useAssetDetails'),
  useAssetDetails: jest.fn(),
}));

jest.mock('./useDecodedTransactionData', () => ({
  ...jest.requireActual('./useDecodedTransactionData'),
  useDecodedTransactionData: jest.fn(),
}));

jest.mock(
  '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate',
  () => jest.fn(),
);

describe('useTokenValues', () => {
  const useAssetDetailsMock = jest.mocked(useAssetDetails);
  const useDecodedTransactionDataMock = jest.mocked(useDecodedTransactionData);
  const useTokenExchangeRateMock = jest.mocked(useTokenExchangeRate);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns native and fiat balances', async () => {
    (useAssetDetailsMock as jest.Mock).mockImplementation(() => ({
      decimals: '10',
    }));
    (useDecodedTransactionDataMock as jest.Mock).mockImplementation(() => ({
      pending: false,
      value: {
        data: [
          {
            name: 'transfer',
            params: [
              {
                type: 'address',
                value: '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4',
              },
              {
                type: 'uint256',
                value: 70000000000,
              },
            ],
          },
        ],
        source: 'FourByte',
      },
    }));
    (useTokenExchangeRateMock as jest.Mock).mockResolvedValue(
      new Numeric(0.91, 10),
    );

    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithConfirmContextProvider(
      () => useTokenValues(transactionMeta),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      decodedTransferValue: 7,
      fiatDisplayValue: '$6.37',
      pending: false,
    });
  });

  it('returns undefined fiat balance if no token rate is returned', async () => {
    (useAssetDetailsMock as jest.Mock).mockImplementation(() => ({
      decimals: '10',
    }));
    (useDecodedTransactionDataMock as jest.Mock).mockImplementation(() => ({
      pending: false,
      value: {
        data: [
          {
            name: 'transfer',
            params: [
              {
                type: 'address',
                value: '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4',
              },
              {
                type: 'uint256',
                value: 70000000000,
              },
            ],
          },
        ],
        source: 'FourByte',
      },
    }));
    (useTokenExchangeRateMock as jest.Mock).mockResolvedValue(null);

    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithConfirmContextProvider(
      () => useTokenValues(transactionMeta),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      decodedTransferValue: 7,
      fiatDisplayValue: null,
      pending: false,
    });
  });
});
