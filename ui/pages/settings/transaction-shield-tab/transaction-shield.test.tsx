import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import { initialState as rewardsInitialState } from '../../../ducks/rewards';
import TransactionShield from './transaction-shield';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation,
  };
});

jest.mock('./shield-banner-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="shield-banner-animation" />,
}));

jest.mock('./shield-subscription-icon-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="shield-subscription-icon-animation" />,
}));

describe('Transaction Shield Page', () => {
  const STATE_MOCK = {
    ...mockState,
    rewards: rewardsInitialState,
    metamask: {
      ...mockState.metamask,
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
          isEligibleForSupport: true,
        } satisfies Subscription,
      ],
    },
  };
  const store = configureMockStore([thunk])(STATE_MOCK);

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
