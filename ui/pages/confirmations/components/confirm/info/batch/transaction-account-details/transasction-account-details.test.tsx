import React from 'react';
import { AuthorizationList } from '@metamask/transaction-controller';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { TransactionAccountDetails } from './transaction-account-details';

const FROM_MOCK = '0x1234567890123456789012345678901234567890';
const DELEGATION_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef';

function render({
  authorizationList,
}: {
  authorizationList?: AuthorizationList;
}) {
  const store = configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        address: FROM_MOCK,
        authorizationList,
      }),
    ),
  );

  return renderWithConfirmContextProvider(<TransactionAccountDetails />, store);
}

describe('TransactionAccountDetails', () => {
  it('renders from address', () => {
    const { getByText } = render({
      authorizationList: [{ address: DELEGATION_MOCK }],
    });

    expect(getByText('0x12345...67890')).toBeInTheDocument();
  });

  it('renders account type', () => {
    const { getByText } = render({
      authorizationList: [{ address: DELEGATION_MOCK }],
    });

    expect(getByText('Smart account')).toBeInTheDocument();
  });

  it('does not render if no authorization list', () => {
    const { queryByText } = render({});

    expect(queryByText('0x12345...67890')).toBeNull();
    expect(queryByText('Smart account')).toBeNull();
  });
});
