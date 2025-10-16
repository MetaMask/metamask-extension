import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/jest/rendering';
import TransactionShield from './transaction-shield';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('Transaction Shield Page', () => {
  const STATE_MOCK = {
    metamask: {
      customerId: '1',
      trialedProducts: [],
      subscriptions: [
        {
          id: '1',
          status: SUBSCRIPTION_STATUSES.active,
          products: [
            {
              name: PRODUCT_TYPES.SHIELD,
              currency: 'usd',
              unitAmount: 100,
              unitDecimals: 2,
            },
          ],
          currentPeriodStart: '2024-04-18',
          currentPeriodEnd: '2024-04-18',
          interval: RECURRING_INTERVALS.month,
          paymentMethod: {
            type: PAYMENT_TYPES.byCard,
            card: {
              brand: 'Visa',
              last4: '1234',
              displayBrand: 'Visa',
            },
          },
        } satisfies Subscription,
      ],
    },
  };
  const store = configureMockStore([])(STATE_MOCK);

  it('should render', () => {
    const { getByTestId } = renderWithProvider(<TransactionShield />, store);

    const transactionShieldPage = getByTestId('transaction-shield-page');
    expect(transactionShieldPage).toBeInTheDocument();
  });

  it('should call onCancelMembership when the cancel membership button is clicked', async () => {
    const { getByTestId } = renderWithProvider(<TransactionShield />, store);

    const cancelMembershipButton = getByTestId(
      'shield-tx-membership-cancel-button',
    );
    fireEvent.click(cancelMembershipButton);

    const cancelMembershipModal = await screen.findByTestId(
      'cancel-membership-modal',
    );

    expect(cancelMembershipModal).toBeInTheDocument();
  });
});
