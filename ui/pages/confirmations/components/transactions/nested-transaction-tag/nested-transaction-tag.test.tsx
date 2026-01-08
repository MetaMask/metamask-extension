import React from 'react';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import configureStore from '../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useNestedTransactionLabels } from '../../confirm/info/hooks/useNestedTransactionLabels';
import { NestedTransactionTag } from './nested-transaction-tag';

jest.mock('../../confirm/info/hooks/useNestedTransactionLabels', () => ({
  useNestedTransactionLabels: jest.fn(),
}));

const FUNCTION_NAME_MOCK = 'TestFunction';
const ADDRESS_MOCK = '0x88aa6343307ec9a652ccddda3646e62b2f1a5125';

const BATCH_TRANSACTION_PARAMS_MOCK: BatchTransactionParams = {
  data: '0x12345',
  to: ADDRESS_MOCK,
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
        address: ADDRESS_MOCK,
        nestedTransactions,
      }),
    ),
  );

  return renderWithConfirmContextProvider(<NestedTransactionTag />, store);
}

describe('NestedTransactionTag', () => {
  const useNestedTransactionLabelsMock = jest.mocked(
    useNestedTransactionLabels,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    useNestedTransactionLabelsMock.mockReturnValue([
      FUNCTION_NAME_MOCK,
      FUNCTION_NAME_MOCK,
    ]);
  });

  it('renders tag label with the right number of transactions', () => {
    useNestedTransactionLabelsMock.mockReturnValue([FUNCTION_NAME_MOCK]);

    const { getByText } = render({
      nestedTransactions: [
        BATCH_TRANSACTION_PARAMS_MOCK,
        BATCH_TRANSACTION_PARAMS_MOCK,
      ],
    });

    expect(getByText('Includes 2 transactions')).toBeInTheDocument();
  });

  it('renders correct tooltip content', () => {
    const { container } = render({
      nestedTransactions: [
        BATCH_TRANSACTION_PARAMS_MOCK,
        BATCH_TRANSACTION_PARAMS_MOCK,
      ],
    });

    const tooltipTrigger = container.querySelector('[data-original-title]');
    expect(tooltipTrigger?.getAttribute('data-original-title')).toBe(
      'This transaction includes: TestFunction, TestFunction.',
    );
  });

  it('does not render if no nested transactions', () => {
    const { container } = render({});
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render if only one nested transaction is present', () => {
    const { container } = render({
      nestedTransactions: [BATCH_TRANSACTION_PARAMS_MOCK],
    });
    expect(container).toBeEmptyDOMElement();
  });
});
