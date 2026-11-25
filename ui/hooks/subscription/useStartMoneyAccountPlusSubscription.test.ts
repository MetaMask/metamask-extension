import { it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  SubscriptionControllerErrorMessage,
  type Subscription,
} from '@metamask/subscription-controller';
import {
  isDevOrTestEnvironment,
  isDevOrUatBuild,
} from '../../../shared/lib/shield/config';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import { getMoneyAccountPlusHubSubscription } from '../../selectors/subscription/subscription';
import {
  forceUpdateMetamaskState,
  getSubscriptions,
} from '../../store/actions';
import {
  checkMoneyAccountPlusBalance,
  startMoneyAccountPlusSubscription,
} from '../../store/controller-actions/subscription-delegation-service';
import { useStartMoneyAccountPlusSubscription } from './useStartMoneyAccountPlusSubscription';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock('../../../shared/lib/shield/config');
jest.mock('../../selectors/money-account');
jest.mock('../../selectors/money/money-account-feature-flags');
jest.mock('../../selectors/subscription/subscription', () => ({
  ...jest.requireActual('../../selectors/subscription/subscription'),
  getMoneyAccountPlusHubSubscription: jest.fn(),
}));
jest.mock('../../store/actions', () => ({
  forceUpdateMetamaskState: jest.fn(),
  getSubscriptions: jest.fn(),
}));
jest.mock('../../store/controller-actions/subscription-delegation-service');

const payerAddress = '0x1111111111111111111111111111111111111111';
const chainId = '0x1';
const interval = RECURRING_INTERVALS.month;
const request = {
  product: PRODUCT_TYPES.MONEY_ACCOUNT_PLUS,
  payerAddress,
  chainId,
  recurringInterval: interval,
};
const hubSubscription = {
  products: [{ name: PRODUCT_TYPES.MONEY_ACCOUNT_PLUS }],
  status: SUBSCRIPTION_STATUSES.awaitingFunds,
} as Subscription;
const mockStart = jest.mocked(startMoneyAccountPlusSubscription);
const mockCheck = jest.mocked(checkMoneyAccountPlusBalance);
const mockForceUpdate = jest.mocked(forceUpdateMetamaskState);
const mockGetSubscriptions = jest.mocked(getSubscriptions);
const dispatch = jest.fn();
const reloadThunk = jest.fn();

function mockPayment(address?: string, chain?: string, subscription?: object) {
  jest.mocked(useSelector).mockImplementation((selector) => {
    if (selector === selectPrimaryMoneyAccount) {
      return { address };
    }
    return selector === getMoneyAccountPlusHubSubscription
      ? subscription
      : { chainId: chain };
  });
}

describe('useStartMoneyAccountPlusSubscription', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useDispatch).mockReturnValue(dispatch);
    mockGetSubscriptions.mockReturnValue(reloadThunk);
    dispatch.mockResolvedValue([hubSubscription]);
    mockPayment(payerAddress, chainId);
  });

  it.each([
    [undefined, chainId],
    [payerAddress, undefined],
  ])(
    'rejects a missing payer or chain before calling the background',
    async (address, chain) => {
      mockPayment(address, chain);
      const { result } = renderHook(useStartMoneyAccountPlusSubscription);
      await expect(result.current.checkBalance(interval)).rejects.toThrow(
        'payment is unavailable',
      );
      await act(async () => {
        await expect(
          result.current.startSubscription(interval),
        ).rejects.toThrow('payment is unavailable');
      });
      expect(mockCheck).not.toHaveBeenCalled();
      expect(mockStart).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    'returns the funding check (%s) without starting',
    async (hasSufficientBalance) => {
      const balance = {
        hasSufficientBalance,
        balance: hasSufficientBalance ? '20000000' : '0',
        requiredBalance: '20000000',
      };
      mockCheck.mockResolvedValue(balance);
      const { result } = renderHook(useStartMoneyAccountPlusSubscription);
      await expect(result.current.checkBalance(interval)).resolves.toEqual(
        balance,
      );
      expect(mockCheck).toHaveBeenCalledWith({
        product: request.product,
        payerAddress,
        recurringInterval: interval,
      });
      expect(mockStart).not.toHaveBeenCalled();
    },
  );

  it.each([
    [false, false],
    [true, false],
    [false, true],
  ])(
    'only includes a requested test clock in supported environments (%s, %s)',
    async (devOrTest, devOrUat) => {
      jest.mocked(isDevOrTestEnvironment).mockReturnValue(devOrTest);
      jest.mocked(isDevOrUatBuild).mockReturnValue(devOrUat);
      const { result } = renderHook(useStartMoneyAccountPlusSubscription);
      await act(async () => {
        await expect(
          result.current.startSubscription(interval, { useTestClock: true }),
        ).resolves.toBe('success');
      });
      expect(mockStart).toHaveBeenCalledWith(
        devOrTest || devOrUat ? { ...request, useTestClock: true } : request,
      );
      expect(mockForceUpdate).toHaveBeenCalledWith(dispatch);
    },
  );

  it('ignores a second submit while the first is in flight', async () => {
    const { result } = renderHook(useStartMoneyAccountPlusSubscription);
    await act(async () => {
      const first = result.current.startSubscription(interval);
      await expect(
        result.current.startSubscription(interval),
      ).resolves.toBeUndefined();
      await first;
    });
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(false);
  });

  it.each([true, false])(
    'refreshes subscriptions when the background reports an existing subscription (refresh ok: %s)',
    async (refreshSucceeds) => {
      mockStart.mockRejectedValue(
        new Error(SubscriptionControllerErrorMessage.UserAlreadySubscribed),
      );
      if (!refreshSucceeds) {
        dispatch.mockRejectedValue(new Error('Refresh failed'));
      }
      const { result } = renderHook(useStartMoneyAccountPlusSubscription);
      await act(async () => {
        await expect(result.current.startSubscription(interval)).resolves.toBe(
          'alreadySubscribed',
        );
      });
      expect(dispatch).toHaveBeenCalledWith(reloadThunk);
      expect(mockForceUpdate).toHaveBeenCalledWith(dispatch);
      expect(result.current.error).toBeUndefined();
    },
  );

  it.each([true, false])(
    'refreshes and returns alreadySubscribed without starting when a hub subscription still exists (refresh ok: %s)',
    async (refreshSucceeds) => {
      mockPayment(payerAddress, chainId, hubSubscription);
      if (!refreshSucceeds) {
        dispatch.mockRejectedValue(new Error('Refresh failed'));
      }
      const { result } = renderHook(useStartMoneyAccountPlusSubscription);
      await act(async () => {
        await expect(result.current.startSubscription(interval)).resolves.toBe(
          'alreadySubscribed',
        );
      });
      expect(dispatch).toHaveBeenCalledWith(reloadThunk);
      expect(mockForceUpdate).toHaveBeenCalledWith(dispatch);
      expect(mockStart).not.toHaveBeenCalled();
    },
  );

  it('starts a subscription when a stale hub subscription is no longer active after refresh', async () => {
    mockPayment(payerAddress, chainId, hubSubscription);
    dispatch.mockResolvedValue([
      { ...hubSubscription, status: SUBSCRIPTION_STATUSES.canceled },
    ]);
    const { result } = renderHook(useStartMoneyAccountPlusSubscription);
    await act(async () => {
      await expect(result.current.startSubscription(interval)).resolves.toBe(
        'success',
      );
    });
    expect(dispatch).toHaveBeenCalledWith(reloadThunk);
    expect(mockStart).toHaveBeenCalledWith(request);
    expect(mockForceUpdate).toHaveBeenCalledTimes(2);
  });

  it('exposes a start failure and clears the submitting state', async () => {
    const error = new Error('Service unavailable');
    mockStart.mockRejectedValue(error);
    const { result } = renderHook(useStartMoneyAccountPlusSubscription);
    await act(async () => {
      await expect(result.current.startSubscription(interval)).rejects.toBe(
        error,
      );
    });
    expect(result.current.error).toBe(error);
    expect(result.current.isSubmitting).toBe(false);
  });
});
