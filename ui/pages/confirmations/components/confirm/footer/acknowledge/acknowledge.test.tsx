import { AuthorizationList } from '@metamask/transaction-controller';
import React from 'react';
import { act } from '@testing-library/react';
import configureStore from '../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { Acknowledge } from './acknowledge';

const DELEGATION_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef';

function render({
  authorizationList,
  isAcknowledged = true,
  onAcknowledgeToggle = () => {
    // Intentionally empty
  },
}: {
  authorizationList?: AuthorizationList;
  isAcknowledged?: boolean;
  onAcknowledgeToggle?: () => void;
}) {
  const store = configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        authorizationList,
      }),
    ),
  );

  return renderWithConfirmContextProvider(
    <Acknowledge
      isAcknowledged={isAcknowledged}
      onAcknowledgeToggle={onAcknowledgeToggle}
    />,
    store,
  );
}

describe('Acknowledge', () => {
  it('renders checkbox if an upgrade transaction', () => {
    const { getByTestId } = render({
      authorizationList: [{ address: DELEGATION_MOCK }],
    });

    expect(getByTestId('confirm-upgrade-acknowledge')).toBeInTheDocument();
  });

  it('calls onAcknowledgeToggle when checkbox is clicked', async () => {
    const onAcknowledgeToggle = jest.fn();

    const { getByTestId } = render({
      authorizationList: [{ address: DELEGATION_MOCK }],
      onAcknowledgeToggle,
    });

    await act(async () => {
      getByTestId('confirm-upgrade-acknowledge').click();
    });

    expect(onAcknowledgeToggle).toHaveBeenCalledTimes(1);
    expect(onAcknowledgeToggle).toHaveBeenCalledWith(false);
  });

  it('does not render if not an upgrade transaction', () => {
    const { container } = render({});
    expect(container).toBeEmptyDOMElement();
  });
});
