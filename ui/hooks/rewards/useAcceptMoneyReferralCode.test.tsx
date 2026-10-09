import { it } from '@jest/globals';
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react';
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
  const { errorMessage, accept } = useAcceptMoneyReferralCode({
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
    </div>
  );
};

function httpFailure(status: number, bodyText?: string) {
  return { data: { status, bodyText } };
}

describe('useAcceptMoneyReferralCode', () => {
  beforeEach(() => {
    mockRegister.mockReset();
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
});
