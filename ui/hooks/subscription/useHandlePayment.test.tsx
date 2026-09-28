import { act } from '@testing-library/react';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
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

  it('tracks a card payment error with the update card clicked type', async () => {
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
      type: ShieldErrorStateClickedTypeEnum.UpdateCard,
    });
    expect(mockExecuteUpdateSubscriptionCardPaymentMethod).toHaveBeenCalled();
  });

  it('tracks a crypto payment error with the add funds clicked type', async () => {
    const onOpenAddFundsModal = jest.fn();
    const cryptoSubscription = {
      ...subscription,
      status: SUBSCRIPTION_STATUSES.paused,
      paymentMethod: {
        type: PAYMENT_TYPES.byCrypto,
        crypto: {
          chainId: '0x1',
          tokenSymbol: 'USDC',
          error: CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE,
        },
      },
    } as unknown as Subscription;

    const { result } = renderHookWithProvider(
      () =>
        useHandlePayment({
          currentShieldSubscription: cryptoSubscription,
          displayedShieldSubscription: cryptoSubscription,
          isCancelled: false,
          onOpenAddFundsModal,
          subscriptions: [cryptoSubscription],
        }),
      mockState,
    );

    await act(async () => {
      await result.current.handlePaymentError();
    });

    expect(mockCaptureShieldErrorStateClickedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ShieldErrorStateClickedTypeEnum.AddFunds,
      }),
    );
    expect(onOpenAddFundsModal).toHaveBeenCalled();
  });

  it('tracks a cancelled subscription error with the renew clicked type', async () => {
    const { result } = renderHookWithProvider(
      () =>
        useHandlePayment({
          currentShieldSubscription: subscription,
          displayedShieldSubscription: subscription,
          isCancelled: true,
          onOpenAddFundsModal: jest.fn(),
          subscriptions: [subscription],
        }),
      mockState,
    );

    await act(async () => {
      await result.current.handlePaymentError();
    });

    expect(mockCaptureShieldErrorStateClickedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ShieldErrorStateClickedTypeEnum.Renew,
      }),
    );
    expect(mockNavigate).toHaveBeenCalled();
  });
});
