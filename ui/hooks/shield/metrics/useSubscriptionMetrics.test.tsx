import {
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateClickedTypeEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../../shared/constants/subscriptions';
import { useSubscriptionMetrics } from './useSubscriptionMetrics';

const mockTrackEvent = jest.fn();

jest.mock('../../useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../useAccountTotalFiatBalance', () => ({
  useAccountTotalFiatBalance: () => ({ totalFiatBalance: '250' }),
}));

const existingSubscription = {
  subscriptionStatus: SUBSCRIPTION_STATUSES.active,
  paymentType: PAYMENT_TYPES.byCard,
  billingInterval: RECURRING_INTERVALS.month,
};

describe('useSubscriptionMetrics', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it('tracks a membership restart with status and error', () => {
    const { result } = renderHookWithProvider(
      () => useSubscriptionMetrics(),
      mockState,
    );

    result.current.captureShieldSubscriptionRestartRequestEvent({
      ...existingSubscription,
      status: 'failed',
      error: 'network',
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ShieldMembershipRestartRequest,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Shield,
          status: 'failed',
          error: 'network',
          subscription_status: SUBSCRIPTION_STATUSES.active,
          billing_interval: 'monthly',
        }),
      }),
    );
  });

  it('tracks a claim submission with status', () => {
    const { result } = renderHookWithProvider(
      () => useSubscriptionMetrics(),
      mockState,
    );

    result.current.captureShieldClaimSubmissionEvent({
      subscriptionStatus: SUBSCRIPTION_STATUSES.active,
      attachmentsCount: 2,
      status: 'completed',
      errorMessage: 'upload failed',
    });

    const [event] = mockTrackEvent.mock.calls[0];
    expect(event).toStrictEqual(
      expect.objectContaining({
        name: MetaMetricsEventName.ShieldClaimSubmission,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Shield,
          subscription_status: SUBSCRIPTION_STATUSES.active,
          attachments_count: 2,
          status: 'completed',
          error: 'upload failed',
        }),
      }),
    );
    expect(event.properties).not.toHaveProperty('submission_status');
  });

  it('tracks an error-state click with the clicked type', () => {
    const { result } = renderHookWithProvider(
      () => useSubscriptionMetrics(),
      mockState,
    );

    result.current.captureShieldErrorStateClickedEvent({
      ...existingSubscription,
      errorCause: 'insufficient_funds',
      actionClicked: ShieldErrorStateActionClickedEnum.Cta,
      location: ShieldErrorStateLocationEnum.Homepage,
      view: ShieldErrorStateViewEnum.Toast,
      type: ShieldErrorStateClickedTypeEnum.UpdateCard,
    });

    const [event] = mockTrackEvent.mock.calls[0];
    expect(event).toStrictEqual(
      expect.objectContaining({
        name: MetaMetricsEventName.ShieldMembershipErrorStateClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Shield,
          type: ShieldErrorStateClickedTypeEnum.UpdateCard,
          action: ShieldErrorStateActionClickedEnum.Cta,
          location: ShieldErrorStateLocationEnum.Homepage,
          view: ShieldErrorStateViewEnum.Toast,
        }),
      }),
    );
    expect(event.properties.type).not.toBe('insufficient_funds');
  });
});
