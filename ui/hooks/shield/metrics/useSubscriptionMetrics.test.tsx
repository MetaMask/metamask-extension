import {
  type ModalType,
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
  ShieldCtaActionClickedEnum,
  ShieldMetricsSourceEnum,
  ShieldSubscriptionRequestSubscriptionStateEnum,
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

const mockGetSelectedEvmAccountUsdBalance = jest.fn().mockReturnValue('250');
jest.mock('../../../selectors/subscription/user-usd-balance', () => ({
  getSelectedEvmAccountUsdBalance: (state: unknown) =>
    mockGetSelectedEvmAccountUsdBalance(state),
}));

const existingSubscription = {
  subscriptionStatus: SUBSCRIPTION_STATUSES.active,
  paymentType: PAYMENT_TYPES.byCard,
  billingInterval: RECURRING_INTERVALS.month,
};

describe('useSubscriptionMetrics', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockGetSelectedEvmAccountUsdBalance.mockReturnValue('250');
  });

  it('reads the USD balance when the event is captured', () => {
    const { result } = renderHookWithProvider(
      () => useSubscriptionMetrics(),
      mockState,
    );

    mockGetSelectedEvmAccountUsdBalance.mockReturnValue('5');
    result.current.captureShieldCtaClickedEvent({
      source: ShieldMetricsSourceEnum.Settings,
      ctaActionClicked: ShieldCtaActionClickedEnum.LearnMore,
    });

    const [event] = mockTrackEvent.mock.calls[0];
    expect(event.properties).toEqual(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        multi_chain_balance_category: '0-99',
      }),
    );
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          subscription_status: SUBSCRIPTION_STATUSES.active,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          billing_interval: 'monthly',
        }),
      }),
    );
  });

  it('tracks sufficient crypto funds with the updated property name', () => {
    const { result } = renderHookWithProvider(
      () => useSubscriptionMetrics(),
      mockState,
    );

    result.current.captureShieldSubscriptionRequestEvent({
      defaultBillingInterval: RECURRING_INTERVALS.month,
      defaultPaymentType: PAYMENT_TYPES.byCard,
      defaultPaymentCurrency: 'USD',
      defaultPaymentChain: '0x1',
      source: ShieldMetricsSourceEnum.Settings,
      type: 'entry' as ModalType,
      subscriptionState: ShieldSubscriptionRequestSubscriptionStateEnum.New,
      paymentType: PAYMENT_TYPES.byCrypto,
      paymentCurrency: 'USDC',
      isTrialSubscription: false,
      billingInterval: RECURRING_INTERVALS.month,
      paymentChain: '0x1',
      hasSufficientCryptoBalance: true,
      gasSponsored: true,
      requestStatus: 'started',
    });

    const [event] = mockTrackEvent.mock.calls[0];
    expect(event.properties).toEqual(
      expect.objectContaining({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        has_sufficient_crypto_funds: true,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        gas_sponsored: true,
      }),
    );
    expect(event.properties).not.toHaveProperty(
      'has_sufficient_crypto_balance',
    );
  });

  it('tracks crypto confirmation status and gas availability', () => {
    const { result } = renderHookWithProvider(
      () => useSubscriptionMetrics(),
      mockState,
    );

    result.current.captureShieldCryptoConfirmationEvent({
      defaultBillingInterval: RECURRING_INTERVALS.year,
      defaultPaymentType: PAYMENT_TYPES.byCard,
      defaultPaymentCurrency: 'USD',
      source: ShieldMetricsSourceEnum.ShieldSettings,
      type: 'entry' as ModalType,
      subscriptionState: ShieldSubscriptionRequestSubscriptionStateEnum.New,
      paymentType: PAYMENT_TYPES.byCrypto,
      paymentCurrency: 'USD',
      isTrialSubscription: true,
      billingInterval: RECURRING_INTERVALS.month,
      paymentChain: '0x1',
      gasSponsored: false,
      requestStatus: 'started',
      confirmationScreenStatus: 'opened',
      hasInsufficientGas: true,
    });

    const [event] = mockTrackEvent.mock.calls[0];
    expect(event).toStrictEqual(
      expect.objectContaining({
        name: MetaMetricsEventName.ShieldSubscriptionCryptoConfirmation,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Shield,
          status: 'opened',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_insufficient_gas: true,
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          subscription_status: SUBSCRIPTION_STATUSES.active,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          attachment_count: 2,
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
