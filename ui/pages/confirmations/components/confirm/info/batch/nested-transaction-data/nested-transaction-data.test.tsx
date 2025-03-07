import React from 'react';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { useFourByte } from '../../hooks/useFourByte';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { NestedTransactionData } from './nested-transaction-data';

jest.mock('../../hooks/useFourByte', () => ({
  useFourByte: jest.fn(),
}));

jest.mock('../../hooks/useDecodedTransactionData', () => ({
  useDecodedTransactionData: jest.fn(),
}));

const FUNCTION_NAME_MOCK = 'TestFunction';

const BATCH_TRANSACTION_PARAMS_MOCK: BatchTransactionParams = {
  data: '0x12345',
  to: '0x1234567890123456789012345678901234567890',
  value: '0xabc',
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
    useDecodedTransactionDataMock.mockReturnValue({
      value: undefined,
      pending: false,
    });
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

  it('does not render if no nested transactions', () => {
    const { container } = render({});
    expect(container).toBeEmptyDOMElement();
  });
});
