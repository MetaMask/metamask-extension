import {
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { getSubscriptionDurationInDays } from './subscription-utils';

const subscription = {
  id: 'sub_123',
  products: [],
  status: SUBSCRIPTION_STATUSES.active,
  interval: RECURRING_INTERVALS.month,
  paymentMethod: {
    type: PAYMENT_TYPES.byCard,
    card: { brand: 'visa', displayBrand: 'visa', last4: '1234' },
  },
  currentPeriodStart: '2024-04-01T00:00:00Z',
  endDate: '2024-04-11T00:00:00Z',
} satisfies Subscription;

describe('getSubscriptionDurationInDays', () => {
  it('calculates the duration when the period start is available', () => {
    expect(getSubscriptionDurationInDays(subscription)).toBe(10);
  });

  it('returns zero when the period start is unavailable', () => {
    expect(
      getSubscriptionDurationInDays({
        ...subscription,
        currentPeriodStart: undefined,
      }),
    ).toBe(0);
  });
});
