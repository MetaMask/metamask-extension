import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import CancelMembershipModal from './cancel-membership-modal';

describe('Cancel Membership Modal', () => {
  const onCloseStub = jest.fn();
  const onConfirmStub = jest.fn();

  it('should render', () => {
    const { getByTestId } = renderWithProvider(
      <CancelMembershipModal onClose={onCloseStub} onConfirm={onConfirmStub} />,
    );

    const cancelMembershipModal = getByTestId('cancel-membership-modal');
    expect(cancelMembershipModal).toBeInTheDocument();
  });
});
