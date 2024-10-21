import { TransactionMeta } from '@metamask/transaction-controller';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import {
  roundDisplayValue,
  toNonScientificString,
  useTokenValues,
} from './use-token-values';
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
      decodedTransferValue: '7',
      displayTransferValue: '7',
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
      decodedTransferValue: '7',
      displayTransferValue: '7',
      fiatDisplayValue: null,
      pending: false,
    });
  });
});

describe('roundDisplayValue', () => {
  const TEST_CASES = [
    { value: 0, rounded: '0' },
    { value: 0.0000009, rounded: '<0.000001' },
    { value: 0.0000456, rounded: '0.000046' },
    { value: 0.0004567, rounded: '0.000457' },
    { value: 0.003456, rounded: '0.00346' },
    { value: 0.023456, rounded: '0.0235' },
    { value: 0.125456, rounded: '0.125' },
    { value: 1.0034, rounded: '1.003' },
    { value: 1.034, rounded: '1.034' },
    { value: 1.3034, rounded: '1.303' },
    { value: 7, rounded: '7' },
    { value: 7.1, rounded: '7.1' },
    { value: 12.0345, rounded: '12.03' },
    { value: 121.456, rounded: '121.5' },
    { value: 1034.123, rounded: '1034' },
    { value: 47361034.006, rounded: '47361034' },
    { value: 12130982923409.555, rounded: '12130982923410' },
  ];

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(TEST_CASES)(
    'Round $value to "$rounded"',
    ({ value, rounded }: { value: number; rounded: string }) => {
      const actual = roundDisplayValue(value);

      expect(actual).toEqual(rounded);
    },
  );
});

describe('toNonScientificString', () => {
  const TEST_CASES = [
    { scientific: 1.23e-5, expanded: '0.0000123' },
    { scientific: 1e-10, expanded: '0.0000000001' },
    { scientific: 1.23e-21, expanded: '1.23e-21' },
  ];

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(TEST_CASES)(
    'Expand $scientific to "$expanded"',
    ({ scientific, expanded }: { scientific: number; expanded: string }) => {
      const actual = toNonScientificString(scientific);

      expect(actual).toEqual(expanded);
    },
  );
});
