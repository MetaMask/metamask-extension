import { it } from '@jest/globals';
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, render, renderHook } from '@testing-library/react';
import { withResolvers } from '#shared/lib/promise-with-resolvers';
import { useAcceptMoneyReferralCode } from './useAcceptMoneyReferralCode';

const mockRegister = jest.fn();
const acceptMessenger = {
  call: (_action: string, params: { code: string }) => mockRegister(params),
};

jest.mock('../useMessenger', () => ({
  useMessenger: () => acceptMessenger,
}));

jest.mock('../useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('./useReferralMe', () => ({
  refreshReferralMeWithRetries: jest.fn(async () => undefined),
}));

const Harness = () => {
  const { errorMessage, isAcceptCoolingDown, accept } =
    useAcceptMoneyReferralCode({
      validateCode: async () => '',
      fetchReferralMe: async () => ({ status: 'settled' }),
      onAccepted: () => undefined,
    });
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          accept('CODE').catch(() => undefined);
        }}
      >
        accept
      </button>
      <span data-testid="error">{errorMessage}</span>
      <span data-testid="cooling">{isAcceptCoolingDown ? 'yes' : 'no'}</span>
    </div>
  );
};

const BusyValidateHarness = ({ status }: { status: number }) => {
  const { errorMessage, isAcceptCoolingDown, accept } =
    useAcceptMoneyReferralCode({
      validateCode: async () => {
        throw {
          data: { status, retryAfterSeconds: 2, bodyText: '' },
        };
      },
      fetchReferralMe: async () => ({ status: 'settled' }),
      onAccepted: () => undefined,
    });
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          accept('CODE').catch(() => undefined);
        }}
      >
        accept
      </button>
      <span data-testid="error">{errorMessage}</span>
      <span data-testid="cooling">{isAcceptCoolingDown ? 'yes' : 'no'}</span>
    </div>
  );
};

function httpFailure(status: number, bodyText?: string) {
  return { data: { status, bodyText } };
}

function serializedHttpFailure(
  status: number,
  bodyText?: string,
  retryAfterSeconds?: number,
) {
  const bag = {
    status,
    ...(bodyText === undefined ? {} : { bodyText }),
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  };
  return { data: { cause: { ...bag, data: bag } } };
}

describe('useAcceptMoneyReferralCode', () => {
  beforeEach(() => {
    mockRegister.mockReset();
  });

  it('does not register when validation completes after unmount', async () => {
    const validation = withResolvers<string>();
    const onAccepted = jest.fn();
    const { result, unmount } = renderHook(() =>
      useAcceptMoneyReferralCode({
        validateCode: () => validation.promise,
        fetchReferralMe: async () => ({ status: 'settled' }),
        onAccepted,
      }),
    );
    let accepting!: ReturnType<typeof result.current.accept>;
    act(() => {
      accepting = result.current.accept('CODE');
    });
    unmount();

    await act(async () => {
      validation.resolve('');
      await accepting;
    });

    expect(mockRegister).not.toHaveBeenCalled();
    expect(onAccepted).not.toHaveBeenCalled();
  });

  it.each(['resolve', 'reject'] as const)(
    'ignores a registration that finishes after unmount: %s',
    async (outcome) => {
      const registration = withResolvers<void>();
      mockRegister.mockReturnValue(registration.promise);
      const onAccepted = jest.fn();
      const { result, unmount } = renderHook(() =>
        useAcceptMoneyReferralCode({
          validateCode: async () => '',
          fetchReferralMe: async () => ({ status: 'settled' }),
          onAccepted,
        }),
      );
      let accepting!: ReturnType<typeof result.current.accept>;
      await act(async () => {
        accepting = result.current.accept('CODE');
      });
      expect(mockRegister).toHaveBeenCalledTimes(1);
      unmount();

      await act(async () => {
        if (outcome === 'resolve') {
          registration.resolve();
        } else {
          registration.reject({ data: { status: 429, retryAfterSeconds: 2 } });
        }
        await accepting;
      });

      expect(onAccepted).not.toHaveBeenCalled();
      expect(await accepting).not.toHaveProperty('refusalReason');
    },
  );

  it('ignores another Accept while validation is pending', async () => {
    const validation = withResolvers<string>();
    const validateCode = jest.fn(() => validation.promise);
    const onAccepted = jest.fn();
    const { result } = renderHook(() =>
      useAcceptMoneyReferralCode({
        validateCode,
        fetchReferralMe: async () => ({ status: 'settled' }),
        onAccepted,
      }),
    );

    await act(async () => {
      const first = result.current.accept('CODE');
      const second = result.current.accept('OTHER');
      validation.resolve('');
      await Promise.all([first, second]);
    });

    expect(validateCode).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith({ code: 'CODE' });
    expect(onAccepted).toHaveBeenCalledTimes(1);
  });

  it.each([
    [422, '', 'rewardsMoneyReferralCodeError'],
    [409, '', 'rewardsMoneyReferralAlreadyReferred'],
    [403, 'own referral code', 'rewardsMoneyReferralOwnCode'],
    [
      403,
      'kol cannot register as a referee',
      'rewardsMoneyReferralReferrerCannotBeReferred',
    ],
    [403, 'recent trading activity', 'rewardsMoneyReferralActiveTrader'],
    [
      403,
      'RestrictedCountryCodeError',
      'rewardsOnboardingIntroUnsupportedRegionDescription',
    ],
    [
      403,
      'not available in your country',
      'rewardsOnboardingIntroUnsupportedRegionDescription',
    ],
  ])('maps a %s refusal', async (status, bodyText, message) => {
    mockRegister.mockRejectedValueOnce(httpFailure(status, bodyText));
    const store = configureStore({ reducer: (state = {}) => state });
    const view = render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    await act(async () => {
      view.getByRole('button', { name: 'accept' }).click();
    });

    expect(view.getByTestId('error').textContent).toBe(message);
  });

  it('maps a 403 that arrives on error.data.cause after RPC', async () => {
    mockRegister.mockRejectedValueOnce(
      serializedHttpFailure(403, 'own referral code'),
    );
    const store = configureStore({ reducer: (state = {}) => state });
    const view = render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    await act(async () => {
      view.getByRole('button', { name: 'accept' }).click();
    });

    expect(view.getByTestId('error').textContent).toBe(
      'rewardsMoneyReferralOwnCode',
    );
  });

  it('shows the generic failure when register throws without a status', async () => {
    mockRegister.mockRejectedValueOnce(new Error('network'));
    const store = configureStore({ reducer: (state = {}) => state });
    const view = render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    await act(async () => {
      view.getByRole('button', { name: 'accept' }).click();
    });

    expect(view.getByTestId('error').textContent).toBe(
      'rewardsMoneyReferralSomethingWentWrong',
    );
  });

  it('holds Accept after a 429 until Retry-After elapses', async () => {
    jest.useFakeTimers();
    try {
      mockRegister.mockRejectedValueOnce(
        serializedHttpFailure(429, 'too many', 2),
      );
      const store = configureStore({ reducer: (state = {}) => state });
      const view = render(
        <Provider store={store}>
          <Harness />
        </Provider>,
      );

      await act(async () => {
        view.getByRole('button', { name: 'accept' }).click();
      });

      expect(view.getByTestId('error').textContent).toBe(
        'rewardsMoneyReferralTooManyTries',
      );
      expect(view.getByTestId('cooling').textContent).toBe('yes');

      mockRegister.mockResolvedValue(undefined);
      await act(async () => {
        view.getByRole('button', { name: 'accept' }).click();
      });
      expect(mockRegister).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      expect(view.getByTestId('cooling').textContent).toBe('no');

      await act(async () => {
        view.getByRole('button', { name: 'accept' }).click();
      });
      expect(mockRegister).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it.each<[429 | 503, string, 'yes' | 'no']>([
    [429, 'rewardsMoneyReferralTooManyTries', 'yes'],
    [503, 'rewardsMoneyReferralSomethingWentWrong', 'no'],
  ])(
    'rethrows a %s from validate instead of calling register',
    async (status, message, cooling) => {
      const store = configureStore({ reducer: (state = {}) => state });
      const view = render(
        <Provider store={store}>
          <BusyValidateHarness status={status} />
        </Provider>,
      );

      await act(async () => {
        view.getByRole('button', { name: 'accept' }).click();
      });

      expect(mockRegister).not.toHaveBeenCalled();
      expect(view.getByTestId('error').textContent).toBe(message);
      expect(view.getByTestId('cooling').textContent).toBe(cooling);
    },
  );
});
