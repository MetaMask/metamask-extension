import React from 'react';
import {
  AuthorizationList,
  NestedTransactionMetadata,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { Confirmation } from '../../../../../types/confirm';
import {
  downgradeAccountConfirmation,
  upgradeAccountConfirmation,
  upgradeAccountConfirmationOnly,
} from '../../../../../../../../test/data/confirmations/batch-transaction';
import { TransactionAccountDetails } from './transaction-account-details';

const FROM_MOCK = '0x1234567890123456789012345678901234567890';
const DELEGATION_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

function render({
  authorizationList,
  nestedTransactions,
}: {
  authorizationList?: AuthorizationList;
  nestedTransactions?: NestedTransactionMetadata[];
}) {
  const store = configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        address: FROM_MOCK,
        authorizationList,
        nestedTransactions,
      }),
    ),
  );

  return renderWithConfirmContextProvider(<TransactionAccountDetails />, store);
}

function renderConfirmation(confirmation: Confirmation) {
  const store = configureStore(getMockConfirmStateForTransaction(confirmation));
  return renderWithConfirmContextProvider(<TransactionAccountDetails />, store);
}

describe('TransactionAccountDetails', () => {
  it('renders from address', () => {
    const { getByText } = renderConfirmation(upgradeAccountConfirmationOnly);

    expect(getByText('0x935E7...05477')).toBeInTheDocument();
  });

  it('renders type row', () => {
    const { getByText, queryByText } = render({
      authorizationList: [{ address: DELEGATION_MOCK }],
    });

    expect(getByText('Smart account')).toBeInTheDocument();
    expect(queryByText('Now')).toBeNull();
  });

  it('does not render if no authorization list', () => {
    const { queryByText } = render({});

    expect(queryByText('0x12345...67890')).toBeNull();
    expect(queryByText('Smart account')).toBeNull();
  });

  it('renders Account Type when transaction is a batch transaction', () => {
    const { getByText } = render({
      authorizationList: [{ address: DELEGATION_MOCK }],
      nestedTransactions: [{ to: FROM_MOCK }],
    });

    expect(getByText('Switching to')).toBeInTheDocument();
  });

  it('renders required data for upgrade request with nested transactions', () => {
    const { getByText } = renderConfirmation(upgradeAccountConfirmation);
    expect(getByText('Switching to')).toBeInTheDocument();
    expect(getByText('Smart contract')).toBeInTheDocument();
  });

  it('renders required data for upgrade only request', () => {
    const { getByText } = renderConfirmation(upgradeAccountConfirmationOnly);
    expect(getByText('0x935E7...05477')).toBeInTheDocument();
    expect(getByText('Standard account')).toBeInTheDocument();
    expect(getByText('Smart contract')).toBeInTheDocument();
  });

  it('renders required data for revoke request', () => {
    const { getByText } = renderConfirmation(downgradeAccountConfirmation);
    expect(getByText('0x8a0bb...bDB87')).toBeInTheDocument();
    expect(getByText('Standard account')).toBeInTheDocument();
    expect(getByText('Smart account')).toBeInTheDocument();
  });

  describe('RecipientRow', () => {
    it('renders when transaction is a batch transaction', () => {
      const ADDRESS_2_MOCK = '0x1234567890123456789012345678901234567891';
      const { getByText, getByTestId } = render({
        authorizationList: [{ address: DELEGATION_MOCK }],
        nestedTransactions: [
          {
            to: FROM_MOCK,
            data: '0x1',
            type: TransactionType.contractInteraction,
          },
          {
            to: ADDRESS_2_MOCK,
            data: '0x2',
            type: TransactionType.contractInteraction,
          },
        ] as NestedTransactionMetadata[],
      });
      expect(
        getByTestId('transaction-details-recipient-row'),
      ).toBeInTheDocument();
      expect(getByText('Interacting with')).toBeInTheDocument();
    });
  });
});
