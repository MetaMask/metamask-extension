import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  CachedLastSelectedPaymentMethod,
  PAYMENT_TYPES,
  PricingResponse,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { getMockApproveConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { tEn } from '../../../../../../../test/lib/i18n-helpers';
import ShieldSubscriptionApproveInfo from './shield-subscription-approve';

jest.mock('../hooks/useDecodedTransactionData', () => ({
  useDecodedTransactionData: jest.fn(() => ({
    pending: false,
    value: {
      data: [
        {
          params: [{ name: 'value', value: '96000000000000000000' }],
        },
      ],
    },
  })),
}));

jest.mock('../../../../../../hooks/useDecodedTransactionData', () => ({
  useDecodedTransactionDataValue: jest.fn(() => ({
    decodeResponse: {
      pending: false,
      value: {
        data: [
          {
            params: [{ name: 'value', value: '96000000000000000000' }],
          },
        ],
      },
    },
    value: '96000000000000000000',
  })),
}));

jest.mock('../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({ decimals: 18 })),
}));

jest.mock('../../../../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptions: jest.fn(() => ({
    trialedProducts: [],
    loading: false,
  })),
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

const mockSubscriptionPricing: PricingResponse = {
  products: [
    {
      name: PRODUCT_TYPES.SHIELD,
      prices: [
        {
          interval: RECURRING_INTERVALS.month,
          unitAmount: 8_000_000,
          unitDecimals: 6,
          currency: 'usd',
          trialPeriodDays: 14,
          minBillingCycles: 12,
        },
        {
          interval: RECURRING_INTERVALS.year,
          unitAmount: 100_000_000,
          unitDecimals: 6,
          currency: 'usd',
          trialPeriodDays: 14,
          minBillingCycles: 1,
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
          paymentAddress: '0x1234567890123456789012345678901234567890',
          tokens: [
            {
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'usdc',
              decimals: 6,
              conversionRate: { usd: '1' },
            },
          ],
        },
      ],
    },
  ],
};

const mockLastUsedPaymentDetail: CachedLastSelectedPaymentMethod = {
  plan: RECURRING_INTERVALS.month,
  paymentTokenAddress: '0x1234567890123456789012345678901234567890',
  type: PAYMENT_TYPES.byCrypto,
};

describe('ShieldSubscriptionApproveInfo', () => {
  it('renders correctly', () => {
    const state = getMockApproveConfirmState();
    // @ts-expect-error - mock state
    state.metamask.lastSelectedPaymentMethod = {
      [PRODUCT_TYPES.SHIELD]: mockLastUsedPaymentDetail,
    };
    // @ts-expect-error - mock state
    state.metamask.pricing = mockSubscriptionPricing;

    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <ShieldSubscriptionApproveInfo />,
      mockStore,
    );

    expect(getByText(tEn('transactionShield') as string)).toBeInTheDocument();
    expect(getByText('$8/month (Monthly)' as string)).toBeInTheDocument();
    expect(getByText(tEn('freeTrialDays', [14]) as string)).toBeInTheDocument();
    expect(getByText(tEn('estimatedChanges') as string)).toBeInTheDocument();
    expect(getByText(tEn('youApprove') as string)).toBeInTheDocument();
    expect(getByText('96')).toBeInTheDocument();
    expect(getByText(tEn('account') as string)).toBeInTheDocument();
    expect(getByText(tEn('networkFee') as string)).toBeInTheDocument();
    expect(getByText(tEn('speed') as string)).toBeInTheDocument();
  });
});
