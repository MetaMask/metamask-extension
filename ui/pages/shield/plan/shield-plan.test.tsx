import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import {
  PAYMENT_TYPES,
  PricingResponse,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  TokenWithApprovalAmount,
  useAvailableTokenBalances,
  useSubscriptionPricing,
} from '../../../hooks/subscription/useSubscriptionPricing';
import {
  useHandleSubscription,
  useShieldRewards,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import ShieldPlan from './shield-plan';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

jest.mock('../../../hooks/subscription/useSubscriptionPricing', () => {
  const actual = jest.requireActual(
    '../../../hooks/subscription/useSubscriptionPricing',
  );
  return {
    ...actual,
    useSubscriptionPricing: jest.fn(),
    useAvailableTokenBalances: jest.fn(),
  };
});

jest.mock('../../../hooks/subscription/useSubscription', () => {
  const actual = jest.requireActual(
    '../../../hooks/subscription/useSubscription',
  );
  return {
    ...actual,
    useUserSubscriptions: jest.fn(),
    useShieldRewards: jest.fn(),
    useHandleSubscription: jest.fn(),
  };
});

const mockUseSubscriptionPricing =
  useSubscriptionPricing as jest.MockedFunction<typeof useSubscriptionPricing>;
const mockUseAvailableTokenBalances =
  useAvailableTokenBalances as jest.MockedFunction<
    typeof useAvailableTokenBalances
  >;
const mockUseUserSubscriptions = useUserSubscriptions as jest.MockedFunction<
  typeof useUserSubscriptions
>;
const mockUseShieldRewards = useShieldRewards as jest.MockedFunction<
  typeof useShieldRewards
>;
const mockUseHandleSubscription = useHandleSubscription as jest.MockedFunction<
  typeof useHandleSubscription
>;

const mockSubscriptionPricing: PricingResponse = {
  products: [
    {
      name: PRODUCT_TYPES.SHIELD,
      prices: [
        {
          interval: RECURRING_INTERVALS.month,
          unitAmount: 9_000_000,
          unitDecimals: 6,
          currency: 'usd',
          trialPeriodDays: 30,
          minBillingCycles: 1,
          minBillingCyclesForBalance: 1,
        },
        {
          interval: RECURRING_INTERVALS.year,
          unitAmount: 99_000_000,
          unitDecimals: 6,
          currency: 'usd',
          trialPeriodDays: 30,
          minBillingCycles: 1,
          minBillingCyclesForBalance: 1,
        },
      ],
    },
  ],
  paymentMethods: [
    {
      type: PAYMENT_TYPES.byCrypto,
      chains: [
        {
          chainId: '0x1',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          tokens: [
            {
              address: '0x0000000000000000000000000000000000000002',
              symbol: 'USDC',
              decimals: 6,
              conversionRate: { usd: '1' },
            },
          ],
        },
      ],
    },
    {
      type: PAYMENT_TYPES.byCard,
    },
  ],
};

const mockUsdcToken: TokenWithApprovalAmount = {
  address: '0x0000000000000000000000000000000000000002',
  symbol: 'USDC',
  image: 'https://example.com/usdc.png',
  type: AssetType.token,
  chainId: '0x1',
  balance: '20',
  string: '20',
  decimals: 6,
  approvalAmount: {
    approveAmount: '9000000',
    chainId: '0x1',
    paymentAddress: '0x0000000000000000000000000000000000000001',
    paymentTokenAddress: '0x0000000000000000000000000000000000000002',
  },
};

describe('Change payment method', () => {
  const mockHandleSubscription = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: '/shield-plan',
      search: '',
    });
    mockUseSubscriptionPricing.mockReturnValue({
      subscriptionPricing: mockSubscriptionPricing,
      loading: false,
      error: undefined,
    });
    mockUseAvailableTokenBalances.mockReturnValue({
      availableTokenBalances: [mockUsdcToken],
      pending: false,
      error: undefined,
    });
    mockUseUserSubscriptions.mockReturnValue({
      subscriptions: [],
      trialedProducts: [],
      isEligible: true,
      loading: false,
      error: undefined,
    });
    mockUseShieldRewards.mockReturnValue({
      isRewardsSeason: false,
      pointsMonthly: 0,
      pointsYearly: 0,
      pending: false,
      error: undefined,
      value: undefined,
    });
    mockUseHandleSubscription.mockReturnValue({
      handleSubscription: mockHandleSubscription,
      subscriptionResult: {
        pending: false,
        error: undefined,
        value: undefined,
      },
    });
  });

  it('should show shield plan page', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByTestId } = renderWithProvider(<ShieldPlan />, mockStore);

    expect(getByTestId('parent-selector-shield-plan-page')).toBeInTheDocument();
  });

  it('should switch to card payment method when selecting Pay by Card on monthly bill', () => {
    mockUseAvailableTokenBalances.mockImplementation(({ price }) => ({
      availableTokenBalances:
        price?.interval === RECURRING_INTERVALS.month ? [mockUsdcToken] : [],
      pending: false,
      error: undefined,
    }));

    const mockStore = configureMockStore([])(mockState);
    const { getByTestId, getByText } = renderWithProvider(
      <ShieldPlan />,
      mockStore,
    );

    // Switch to monthly plan where crypto token balance is sufficient
    fireEvent.click(getByTestId('shield-plan-monthly-button'));

    expect(mockUseHandleSubscription).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedPlan: RECURRING_INTERVALS.month,
        selectedPaymentMethod: PAYMENT_TYPES.byCrypto,
      }),
    );

    // Open payment method modal and select Pay by Card
    fireEvent.click(getByText('USDC'));
    fireEvent.click(getByTestId('shield-payment-method-card-button'));

    expect(mockUseHandleSubscription).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedPlan: RECURRING_INTERVALS.month,
        selectedPaymentMethod: PAYMENT_TYPES.byCard,
      }),
    );
  });
});
