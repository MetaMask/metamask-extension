import React from 'react';
import {
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  Subscription,
} from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/jest/rendering';
import CancelMembershipModal from './cancel-membership-modal';

const mockSubscription: Subscription = {
  id: '1',
  currentPeriodEnd: '2024-04-18',
  products: [],
  currentPeriodStart: '2024-04-18',
  status: SUBSCRIPTION_STATUSES.active,
  interval: RECURRING_INTERVALS.month,
  paymentMethod: {
    type: PAYMENT_TYPES.byCard,
    card: {
      brand: 'Visa',
      last4: '1234',
      displayBrand: 'Visa',
    },
  },
  isEligibleForSupport: true,
};

describe('Cancel Membership Modal', () => {
  const onCloseStub = jest.fn();
  const onConfirmStub = jest.fn();

  it('should render', () => {
    const { getByTestId } = renderWithProvider(
      <CancelMembershipModal
        onClose={onCloseStub}
        onConfirm={onConfirmStub}
        subscription={mockSubscription}
      />,
    );

    const cancelMembershipModal = getByTestId('cancel-membership-modal');
    expect(cancelMembershipModal).toBeInTheDocument();
  });
});
