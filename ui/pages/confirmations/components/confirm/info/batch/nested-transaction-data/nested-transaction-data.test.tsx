import React from 'react';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import { act, fireEvent, waitFor } from '@testing-library/react';

import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataResponse,
  DecodedTransactionDataSource,
} from '../../../../../../../../shared/types';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getTokenStandardAndDetails } from '../../../../../../../store/actions';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import * as DappSwapContextModule from '../../../../../context/dapp-swap';
import { useFourByte } from '../../hooks/useFourByte';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { AsyncResult, RESULT_IDLE } from '../../../../../../../hooks/useAsync';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import { NestedTransactionData } from './nested-transaction-data';

jest.mock('../../../../../../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
}));

jest.mock('../../hooks/useFourByte', () => ({
  useFourByte: jest.fn(),
}));

jest.mock('../../hooks/useDecodedTransactionData', () => ({
  useDecodedTransactionData: jest.fn(),
}));

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: () => ({
      trackAlertMetrics: jest.fn(),
    }),
  }),
);

const FUNCTION_NAME_MOCK = 'TestFunction';

const BATCH_TRANSACTION_PARAMS_MOCK: BatchTransactionParams = {
  data: '0x12345',
  to: '0x1234567890123456789012345678901234567890',
  value: '0x5',
};

function render({
  nestedTransactions,
}: {
  nestedTransactions?: BatchTransactionParams[];
}) {
  const store = configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        nestedTransactions,
      }),
    ),
  );

  return renderWithConfirmContextProvider(<NestedTransactionData />, store);
}

describe('NestedTransaction', () => {
  const useFourByteMock = jest.mocked(useFourByte);
  const useDecodedTransactionDataMock = jest.mocked(useDecodedTransactionData);

  beforeEach(() => {
    jest.resetAllMocks();

    useFourByteMock.mockReturnValue(undefined);
    useDecodedTransactionDataMock.mockReturnValue(RESULT_IDLE);
  });

  it('renders label as transaction index', () => {
    const { getByText } = render({
      nestedTransactions: [BATCH_TRANSACTION_PARAMS_MOCK],
    });

    expect(getByText('Transaction 1')).toBeInTheDocument();
  });

  it('renders label as function name', () => {
    useFourByteMock.mockReturnValue({ name: FUNCTION_NAME_MOCK });

    const { getByText } = render({
      nestedTransactions: [BATCH_TRANSACTION_PARAMS_MOCK],
    });

    expect(getByText(FUNCTION_NAME_MOCK)).toBeInTheDocument();
  });

  it('renders recipient', () => {
    const { getByText } = render({
      nestedTransactions: [BATCH_TRANSACTION_PARAMS_MOCK],
    });

    expect(getByText('0x12345...67890')).toBeInTheDocument();
    expect(getByText(messages.amount.message)).toBeInTheDocument();
    expect(getByText('<0.000001')).toBeInTheDocument();
    expect(getByText('GoerliETH')).toBeInTheDocument();
  });

  it('renders transaction data', () => {
    const { getByText } = render({
      nestedTransactions: [BATCH_TRANSACTION_PARAMS_MOCK],
    });

    expect(
      getByText(BATCH_TRANSACTION_PARAMS_MOCK.data as string),
    ).toBeInTheDocument();
  });

  it('renders multiple nested transactions', () => {
    const { getByText } = render({
      nestedTransactions: [
        BATCH_TRANSACTION_PARAMS_MOCK,
        BATCH_TRANSACTION_PARAMS_MOCK,
      ],
    });

    expect(getByText('Transaction 1')).toBeInTheDocument();
    expect(getByText('Transaction 2')).toBeInTheDocument();
  });

  it('renders nested approvals', async () => {
    (getTokenStandardAndDetails as jest.Mock).mockResolvedValue({
      decimals: 6,
      symbol: 'ETH',
      standard: 'ERC20',
      amountOrTokenId: '10000000',
    });
    useDecodedTransactionDataMock.mockReturnValue({
      pending: false as const,
      value: {
        data: [{ name: 'approve' } as DecodedTransactionDataMethod],
        source: '' as DecodedTransactionDataSource,
      },
    } as unknown as AsyncResult<DecodedTransactionDataResponse>);

    const container = render({
      nestedTransactions: [
        {
          data: '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000009184e72a000',
          to: '0x1234567890123456789012345678901234567890',
        },
      ],
    });

    const { getByText } = container;

    await waitFor(() => {
      expect(getByText('approve')).toBeInTheDocument();
      expect(getByText(messages.spender.message)).toBeInTheDocument();
      expect(getByText(messages.amount.message)).toBeInTheDocument();
      expect(getByText('10000000 ETH')).toBeInTheDocument();
    });
  });

  it('keeps the expanded state with its transaction when a transaction is inserted before it', () => {
    const transactionA = {
      ...BATCH_TRANSACTION_PARAMS_MOCK,
      to: '0x1111111111111111111111111111111111111111',
    } as BatchTransactionParams;
    const transactionB = {
      ...BATCH_TRANSACTION_PARAMS_MOCK,
      to: '0x2222222222222222222222222222222222222222',
    } as BatchTransactionParams;
    const transactionC = {
      ...BATCH_TRANSACTION_PARAMS_MOCK,
      to: '0x3333333333333333333333333333333333333333',
    } as BatchTransactionParams;

    const confirmation = genUnapprovedContractInteractionConfirmation({
      nestedTransactions: [transactionA, transactionB],
    });
    const store = configureStore(
      getMockConfirmStateForTransaction(confirmation),
    );
    const { getAllByLabelText } = renderWithConfirmContextProvider(
      <NestedTransactionData />,
      store,
    );
    const getExpandedStates = () =>
      getAllByLabelText('expand').map((button) =>
        button.classList.contains('expanded'),
      );

    fireEvent.click(getAllByLabelText('expand')[1]);
    expect(getExpandedStates()).toStrictEqual([false, true]);

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            {
              ...confirmation,
              nestedTransactions: [transactionC, transactionA, transactionB],
            },
          ],
        },
      });
    });

    expect(getExpandedStates()).toStrictEqual([false, false, true]);
  });

  it('keeps the expanded state when the call data of a transaction is edited', () => {
    const approveData =
      '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae0000000000000000000000000000000000000000000000000000000000000001';
    const editedApproveData =
      '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae0000000000000000000000000000000000000000000000000000000000000002';

    const confirmation = genUnapprovedContractInteractionConfirmation({
      nestedTransactions: [
        BATCH_TRANSACTION_PARAMS_MOCK,
        { ...BATCH_TRANSACTION_PARAMS_MOCK, data: approveData },
      ],
    });
    const store = configureStore(
      getMockConfirmStateForTransaction(confirmation),
    );
    const { getAllByLabelText } = renderWithConfirmContextProvider(
      <NestedTransactionData />,
      store,
    );

    fireEvent.click(getAllByLabelText('expand')[1]);

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            {
              ...confirmation,
              nestedTransactions: [
                BATCH_TRANSACTION_PARAMS_MOCK,
                { ...BATCH_TRANSACTION_PARAMS_MOCK, data: editedApproveData },
              ],
            },
          ],
        },
      });
    });

    expect(
      getAllByLabelText('expand').map((button) =>
        button.classList.contains('expanded'),
      ),
    ).toStrictEqual([false, true]);
  });

  it('does not render if no nested transactions', () => {
    const { container } = render({});
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render if quoted swap is selected', () => {
    jest.spyOn(DappSwapContextModule, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
    } as unknown as ReturnType<
      typeof DappSwapContextModule.useDappSwapContext
    >);

    const { queryByText } = render({
      nestedTransactions: [
        BATCH_TRANSACTION_PARAMS_MOCK,
        BATCH_TRANSACTION_PARAMS_MOCK,
      ],
    });

    expect(queryByText('Transaction 1')).not.toBeInTheDocument();
  });
});
