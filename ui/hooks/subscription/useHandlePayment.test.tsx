import { act } from '@testing-library/react';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  type Subscription,
} from '@metamask/subscription-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import {
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateClickedTypeEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../shared/constants/subscriptions';
import { useHandlePayment } from './useHandlePayment';

const mockNavigate = jest.fn();
const mockCaptureShieldErrorStateClickedEvent = jest.fn();
const mockExecuteUpdateSubscriptionCardPaymentMethod = jest
  .fn()
  .mockResolvedValue(undefined);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../shield/metrics/useSubscriptionMetrics', () => ({
  useSubscriptionMetrics: () => ({
    captureShieldErrorStateClickedEvent:
      mockCaptureShieldErrorStateClickedEvent,
  }),
}));

jest.mock('./useSubscriptionPricing', () => ({
  useSubscriptionPaymentMethods: () => undefined,
}));

jest.mock('./useAddFundTrigger', () => ({
  useShieldSubscriptionCryptoSufficientBalanceCheck: () => ({
    hasAvailableSelectedToken: false,
  }),
  useHandleShieldAddFundTrigger: () => ({
    handleTriggerSubscriptionCheck: jest.fn(),
    result: undefined,
  }),
}));

jest.mock('./useSubscription', () => ({
  useUpdateSubscriptionCardPaymentMethod: () => [
    mockExecuteUpdateSubscriptionCardPaymentMethod,
    undefined,
  ],
  useSubscriptionCryptoApprovalTransaction: () => ({
    execute: jest.fn(),
  }),
  useUpdateSubscriptionCryptoPaymentMethod: () => ({
    execute: jest.fn(),
    result: undefined,
  }),
  useHandleSubscriptionSupportAction: () => ({
    handleClickContactSupport: jest.fn(),
  }),
}));

describe('useHandlePayment', () => {
  const subscription = {
    id: 'shield-subscription-id',
    status: 'active',
    products: [{ name: PRODUCT_TYPES.SHIELD }],
    paymentMethod: {
      type: PAYMENT_TYPES.byCard,
    },
    interval: RECURRING_INTERVALS.month,
  } as unknown as Subscription;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks a renew error with the renew clicked type', async () => {
    const { result } = renderHookWithProvider(
      () =>
        useHandlePayment({
          currentShieldSubscription: subscription,
          displayedShieldSubscription: subscription,
          isCancelled: false,
          onOpenAddFundsModal: jest.fn(),
          subscriptions: [subscription],
        }),
      mockState,
    );

    await act(async () => {
      await result.current.handlePaymentError();
    });

    expect(mockCaptureShieldErrorStateClickedEvent).toHaveBeenCalledWith({
      subscriptionStatus: 'active',
      paymentType: PAYMENT_TYPES.byCard,
      billingInterval: RECURRING_INTERVALS.month,
      errorCause: 'payment_error',
      actionClicked: ShieldErrorStateActionClickedEnum.Cta,
      location: ShieldErrorStateLocationEnum.Settings,
      view: ShieldErrorStateViewEnum.Banner,
      type: ShieldErrorStateClickedTypeEnum.Renew,
    });
    expect(mockExecuteUpdateSubscriptionCardPaymentMethod).toHaveBeenCalled();
  });
});
