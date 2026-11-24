import type {
  MoneyAccountBalanceCheckRequest,
  MoneyAccountBalanceCheckResult,
  StartSubscriptionWithDelegationRequest,
  StartSubscriptionWithDelegationResult,
} from '@metamask/subscription-controller';
import { submitRequestToBackground } from '../background-connection';
import {
  checkMoneyAccountPlusBalance,
  startMoneyAccountPlusSubscription,
} from './subscription-delegation-service';

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const payerAddress = '0x0000000000000000000000000000000000000001';

beforeEach(() => {
  mockSubmitRequestToBackground.mockReset();
});

describe('checkMoneyAccountPlusBalance', () => {
  it('checks the balance through the delegation service messenger action', async () => {
    const request: MoneyAccountBalanceCheckRequest = {
      product: 'money_account_plus',
      recurringInterval: 'month',
      payerAddress,
    };
    const balanceCheck: MoneyAccountBalanceCheckResult = {
      hasSufficientBalance: false,
      balance: '1000000',
      requiredBalance: '2000000',
    };
    mockSubmitRequestToBackground.mockResolvedValue(balanceCheck);

    const result = await checkMoneyAccountPlusBalance(request);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'SubscriptionDelegationService:checkMoneyAccountBalance',
      [request],
    );
    expect(result).toBe(balanceCheck);
  });

  it('propagates a balance check error from the background', async () => {
    const error = new Error('Balance check failed');
    mockSubmitRequestToBackground.mockRejectedValue(error);

    await expect(
      checkMoneyAccountPlusBalance({
        product: 'money_account_plus',
        recurringInterval: 'month',
        payerAddress,
      }),
    ).rejects.toBe(error);
  });
});

describe('startMoneyAccountPlusSubscription', () => {
  it('starts the subscription through the delegation service messenger action', async () => {
    const request: StartSubscriptionWithDelegationRequest = {
      product: 'money_account_plus',
      recurringInterval: 'year',
      payerAddress,
      chainId: '0x1',
      useTestClock: true,
    };
    const subscription: StartSubscriptionWithDelegationResult = {
      id: 'subscription-1',
      products: [
        {
          name: 'money_account_plus',
          currency: 'usd',
          unitAmount: 10000,
          unitDecimals: 2,
        },
      ],
      currentPeriodStart: '2026-11-24T00:00:00Z',
      currentPeriodEnd: '2027-11-24T00:00:00Z',
      status: 'awaiting_funds',
      interval: 'year',
      paymentMethod: {
        type: 'crypto',
        crypto: { payerAddress, chainId: '0x1', tokenSymbol: 'mUSD' },
      },
      cancelType: 'allowed_at_period_end',
      isEligibleForSupport: false,
    };
    mockSubmitRequestToBackground.mockResolvedValue(subscription);

    const result = await startMoneyAccountPlusSubscription(request);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'SubscriptionDelegationService:startSubscriptionWithDelegation',
      [request],
    );
    expect(result).toBe(subscription);
  });

  it('propagates a subscription start error from the background', async () => {
    const error = new Error('Subscription start failed');
    mockSubmitRequestToBackground.mockRejectedValue(error);

    await expect(
      startMoneyAccountPlusSubscription({
        product: 'money_account_plus',
        recurringInterval: 'year',
        payerAddress,
        chainId: '0x1',
      }),
    ).rejects.toBe(error);
  });
});
