import React from 'react';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { useNestedTransactionLabel } from '../../hooks/useNestedTransactionLabel';
import { NestedTransactionTag } from './nested-transaction-tag';

jest.mock('../../hooks/useNestedTransactionLabel', () => ({
  useNestedTransactionLabel: jest.fn(),
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
  const useNestedTransactionLabelMock = jest.mocked(useNestedTransactionLabel);

  beforeEach(() => {
    jest.resetAllMocks();

    useNestedTransactionLabelMock.mockReturnValue({ functionName: undefined });
  });

  it('renders tag label with the right number of transactions', () => {
    useNestedTransactionLabelMock.mockReturnValue({
      functionName: FUNCTION_NAME_MOCK,
    });

    const { getByText } = render({
      nestedTransactions: [
        BATCH_TRANSACTION_PARAMS_MOCK,
        BATCH_TRANSACTION_PARAMS_MOCK,
      ],
    });

    expect(getByText('Includes 2 transactions')).toBeInTheDocument();
  });

  it('matches snapshot', async () => {
    useNestedTransactionLabelMock.mockReturnValue({
      functionName: FUNCTION_NAME_MOCK,
    });

    const { container } = render({
      nestedTransactions: [
        BATCH_TRANSACTION_PARAMS_MOCK,
        BATCH_TRANSACTION_PARAMS_MOCK,
      ],
    });

    expect(container).toMatchSnapshot();
  });

  it('does not render if no nested transactions', () => {
    const { container } = render({});
    expect(container).toBeEmptyDOMElement();
  });
});
