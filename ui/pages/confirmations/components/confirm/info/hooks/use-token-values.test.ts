import { TransactionMeta } from '@metamask/transaction-controller';
import { Numeric } from '../../../../../../../shared/lib/Numeric';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import { useTokenValues } from './use-token-values';

jest.mock('../../../../hooks/useAssetDetails', () => ({
  ...jest.requireActual('../../../../hooks/useAssetDetails'),
  useAssetDetails: jest.fn(),
}));

jest.mock(
  '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate',
);

describe('useTokenValues', () => {
  const useAssetDetailsMock = jest.mocked(useAssetDetails);
  const useTokenExchangeRateMock = jest.mocked(useTokenExchangeRate);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns native and fiat balances', async () => {
    (useAssetDetailsMock as jest.Mock).mockImplementation(() => ({
      decimals: '4',
    }));

    useTokenExchangeRateMock.mockReturnValue(new Numeric(0.91, 10));

    const transactionMeta = genUnapprovedTokenTransferConfirmation({
      amountHex:
        '0000000000000000000000000000000000000000000000000000000000011170',
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenValues(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current).toEqual({
      decodedTransferValue: '7',
      displayTransferValue: '7',
      fiatDisplayValue: '$6.37',
      fiatValue: 6.37,
      pending: false,
    });
  });

  it('uses original transaction params when the transaction is wrapped', () => {
    (useAssetDetailsMock as jest.Mock).mockImplementation(() => ({
      decimals: '4',
    }));

    useTokenExchangeRateMock.mockReturnValue(new Numeric(0.91, 10));

    const transactionMeta = genUnapprovedTokenTransferConfirmation({
      amountHex:
        '0000000000000000000000000000000000000000000000000000000000011170',
    }) as TransactionMeta;
    const originalTxParams = { ...transactionMeta.txParams };
    transactionMeta.txParamsOriginal = originalTxParams;
    transactionMeta.txParams = {
      ...transactionMeta.txParams,
      data: '0x1234',
      to: '0x1111111111111111111111111111111111111111',
      value: '0x0',
    };

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenValues(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current).toEqual({
      decodedTransferValue: '7',
      displayTransferValue: '7',
      fiatDisplayValue: '$6.37',
      fiatValue: 6.37,
      pending: false,
    });
    expect(useTokenExchangeRateMock).toHaveBeenCalledWith(
      originalTxParams.to,
      transactionMeta.chainId,
    );
    expect(useAssetDetailsMock).toHaveBeenCalledWith(
      originalTxParams.to,
      originalTxParams.from,
      originalTxParams.data,
      transactionMeta.chainId,
    );
  });

  it('returns undefined fiat balance and pending=false if no token rate is returned', async () => {
    (useAssetDetailsMock as jest.Mock).mockImplementation(() => ({
      decimals: '4',
    }));

    useTokenExchangeRateMock.mockReturnValue(undefined);

    const transactionMeta = genUnapprovedTokenTransferConfirmation({
      amountHex:
        '0000000000000000000000000000000000000000000000000000000000011170',
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenValues(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    // pending is false because decimals and value are available.
    // Exchange rate being unavailable should not keep showing a skeleton.
    expect(result.current).toEqual({
      decodedTransferValue: '7',
      displayTransferValue: '7',
      fiatDisplayValue: undefined,
      fiatValue: undefined,
      pending: false,
    });
  });
});
