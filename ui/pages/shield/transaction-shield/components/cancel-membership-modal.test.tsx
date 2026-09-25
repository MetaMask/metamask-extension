import React from 'react';
import {
  CANCEL_TYPES,
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  Subscription,
} from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
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
  cancelType: CANCEL_TYPES.ALLOWED_AT_PERIOD_END,
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

  it('does not offer cancellation when the API omits the cancel type', () => {
    const { queryByTestId } = renderWithProvider(
      <CancelMembershipModal
        onClose={onCloseStub}
        onConfirm={onConfirmStub}
        subscription={{ ...mockSubscription, cancelType: undefined }}
      />,
    );

    expect(
      queryByTestId('cancel-membership-modal-submit-button'),
    ).not.toBeInTheDocument();
  });

  it('does not offer cancellation at period end when the end date is missing', () => {
    const { queryByTestId } = renderWithProvider(
      <CancelMembershipModal
        onClose={onCloseStub}
        onConfirm={onConfirmStub}
        subscription={{ ...mockSubscription, currentPeriodEnd: undefined }}
      />,
    );

    expect(
      queryByTestId('cancel-membership-modal-submit-button'),
    ).not.toBeInTheDocument();
  });
});
