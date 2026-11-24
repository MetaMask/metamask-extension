import { it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  SubscriptionControllerErrorMessage,
} from '@metamask/subscription-controller';
import {
  isDevOrTestEnvironment,
  isDevOrUatBuild,
} from '../../../shared/lib/shield/config';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import {
  checkMoneyAccountPlusBalance,
  startMoneyAccountPlusSubscription,
} from '../../store/controller-actions/subscription-delegation-service';
import { useStartMoneyAccountPlusSubscription } from './useStartMoneyAccountPlusSubscription';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('../../../shared/lib/shield/config');
jest.mock('../../selectors/money-account');
jest.mock('../../selectors/money/money-account-feature-flags');
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
const mockStart = jest.mocked(startMoneyAccountPlusSubscription);
const mockCheck = jest.mocked(checkMoneyAccountPlusBalance);

function mockPayment(address?: string, chain?: string) {
  jest
    .mocked(useSelector)
    .mockImplementation((selector) =>
      selector === selectPrimaryMoneyAccount ? { address } : { chainId: chain },
    );
}

describe('useStartMoneyAccountPlusSubscription', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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

  it('returns alreadySubscribed when the background reports an existing subscription', async () => {
    mockStart.mockRejectedValue(
      new Error(SubscriptionControllerErrorMessage.UserAlreadySubscribed),
    );
    const { result } = renderHook(useStartMoneyAccountPlusSubscription);
    await act(async () => {
      await expect(result.current.startSubscription(interval)).resolves.toBe(
        'alreadySubscribed',
      );
    });
    expect(result.current.error).toBeUndefined();
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
