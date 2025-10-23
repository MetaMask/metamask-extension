import React from 'react';
import configureMockStore from 'redux-mock-store';
import { ProductPrice } from '@metamask/subscription-controller';
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

jest.mock('../../../../../../hooks/subscription/useSubscriptionPricing', () => {
  const mockProductPrice: ProductPrice = {
    interval: 'month',
    minBillingCycles: 12,
    unitAmount: 8000000,
    unitDecimals: 6,
    currency: 'usd',
    trialPeriodDays: 7,
  };
  return {
    useShieldSubscriptionPricingFromTokenApproval: jest.fn(() => ({
      productPrice: mockProductPrice,
      pending: false,
    })),
  };
});

describe('ShieldSubscriptionApproveInfo', () => {
  it('renders correctly', () => {
    const state = getMockApproveConfirmState();
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <ShieldSubscriptionApproveInfo />,
      mockStore,
    );

    expect(getByText(tEn('transactionShield') as string)).toBeInTheDocument();
    expect(getByText('$8/month (Monthly)' as string)).toBeInTheDocument();
    expect(getByText(tEn('freeSevenDayTrial') as string)).toBeInTheDocument();
    expect(getByText(tEn('estimatedChanges') as string)).toBeInTheDocument();
    expect(getByText(tEn('youApprove') as string)).toBeInTheDocument();
    expect(getByText('96')).toBeInTheDocument();
    expect(getByText(tEn('account') as string)).toBeInTheDocument();
    expect(getByText(tEn('networkFee') as string)).toBeInTheDocument();
    expect(getByText(tEn('speed') as string)).toBeInTheDocument();
  });
});
