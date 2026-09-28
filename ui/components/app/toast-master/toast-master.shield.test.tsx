import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  type Subscription,
} from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import {
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateClickedTypeEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../../shared/constants/subscriptions';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { ToastMaster } from './toast-master';

const mockCaptureShieldErrorStateClickedEvent = jest.fn();
const originalConsoleWarn = console.warn;

jest.mock('../../../hooks/shield/metrics/useSubscriptionMetrics', () => ({
  useSubscriptionMetrics: jest.fn(),
}));

jest.mock('../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptionByProduct: jest.fn(),
  useUserSubscriptions: jest.fn(),
}));

const pausedShieldSubscription = {
  status: SUBSCRIPTION_STATUSES.paused,
  products: [{ name: PRODUCT_TYPES.SHIELD }],
  paymentMethod: {
    type: PAYMENT_TYPES.byCard,
  },
  interval: RECURRING_INTERVALS.month,
} as unknown as Subscription;

describe('ToastMaster Shield paused toast', () => {
  const previousShieldEnabled = process.env.METAMASK_SHIELD_ENABLED;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.METAMASK_SHIELD_ENABLED = 'true';
    jest.clearAllMocks();
    consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation((...args: unknown[]) => {
        const message = args.map(String).join(' ');
        if (
          message.includes('Background connection') ||
          message.includes('NO_BACKGROUND_CONNECTION_MESSAGE')
        ) {
          return;
        }
        originalConsoleWarn(...args);
      });
    jest.mocked(useSubscriptionMetrics).mockReturnValue({
      captureShieldErrorStateClickedEvent:
        mockCaptureShieldErrorStateClickedEvent,
    } as unknown as ReturnType<typeof useSubscriptionMetrics>);
    jest.mocked(useUserSubscriptions).mockReturnValue({
      subscriptions: [pausedShieldSubscription],
    } as unknown as ReturnType<typeof useUserSubscriptions>);
    jest
      .mocked(useUserSubscriptionByProduct)
      .mockReturnValue(pausedShieldSubscription);
  });

  afterAll(() => {
    process.env.METAMASK_SHIELD_ENABLED = previousShieldEnabled;
    consoleWarnSpy?.mockRestore();
  });

  it('tracks the update card type when the toast CTA is clicked', () => {
    const { getByRole } = renderWithProvider(
      <ToastMaster />,
      configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          isUnlocked: true,
          shieldPausedToastLastClickedOrClosed: null,
        },
      }),
      '/',
    );

    fireEvent.click(
      getByRole('button', {
        name: messages.shieldPaymentPausedActionCardPayment.message,
      }),
    );

    expect(mockCaptureShieldErrorStateClickedEvent).toHaveBeenCalledWith({
      subscriptionStatus: SUBSCRIPTION_STATUSES.paused,
      paymentType: PAYMENT_TYPES.byCard,
      billingInterval: RECURRING_INTERVALS.month,
      cryptoPaymentChain: undefined,
      cryptoPaymentCurrency: undefined,
      errorCause: 'payment_error',
      actionClicked: ShieldErrorStateActionClickedEnum.Cta,
      location: ShieldErrorStateLocationEnum.Homepage,
      view: ShieldErrorStateViewEnum.Toast,
      type: ShieldErrorStateClickedTypeEnum.UpdateCard,
    });
  });
});
