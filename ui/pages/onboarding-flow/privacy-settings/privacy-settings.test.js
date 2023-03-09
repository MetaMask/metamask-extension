import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  renderWithProvider,
  setBackgroundConnection,
} from '../../../../test/jest';
import PrivacySettings from './privacy-settings';

describe('Privacy Settings Onboarding View', () => {
  const mockStore = {
    metamask: {
      frequentRpcListDetail: [],
      provider: {
        type: 'test',
      },
    },
  };

  const store = configureMockStore([thunk])(mockStore);
  const setFeatureFlagStub = jest.fn();
  const setUsePhishDetectStub = jest.fn();
  const setUseTokenDetectionStub = jest.fn();
  const setUseCurrencyRateCheckStub = jest.fn();
  const completeOnboardingStub = jest
    .fn()
    .mockImplementation(() => Promise.resolve());
  const setUseMultiAccountBalanceCheckerStub = jest.fn();

  setBackgroundConnection({
    setFeatureFlag: setFeatureFlagStub,
    setUsePhishDetect: setUsePhishDetectStub,
    setUseTokenDetection: setUseTokenDetectionStub,
    setUseCurrencyRateCheck: setUseCurrencyRateCheckStub,
    completeOnboarding: completeOnboardingStub,
    setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
  });

  it('should update preferences', () => {
    const { container, getByText } = renderWithProvider(
      <PrivacySettings />,
      store,
    );
    // All settings are initialized toggled to true
    expect(setFeatureFlagStub).toHaveBeenCalledTimes(0);
    expect(setUsePhishDetectStub).toHaveBeenCalledTimes(0);
    expect(setUseTokenDetectionStub).toHaveBeenCalledTimes(0);
    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(0);
    expect(setUseCurrencyRateCheckStub).toHaveBeenCalledTimes(0);

    const toggles = container.querySelectorAll('input[type=checkbox]');
    const submitButton = getByText('Done');

    // toggle to false
    fireEvent.click(toggles[0]);
    fireEvent.click(toggles[1]);
    fireEvent.click(toggles[2]);
    fireEvent.click(toggles[3]);
    fireEvent.click(toggles[4]);
    fireEvent.click(submitButton);

    expect(setFeatureFlagStub).toHaveBeenCalledTimes(1);
    expect(setUsePhishDetectStub).toHaveBeenCalledTimes(1);
    expect(setUseTokenDetectionStub).toHaveBeenCalledTimes(1);
    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(1);
    expect(setUseCurrencyRateCheckStub).toHaveBeenCalledTimes(1);

    expect(setFeatureFlagStub.mock.calls[0][1]).toStrictEqual(false);
    expect(setUsePhishDetectStub.mock.calls[0][0]).toStrictEqual(false);
    expect(setUseTokenDetectionStub.mock.calls[0][0]).toStrictEqual(false);
    expect(setUseMultiAccountBalanceCheckerStub.mock.calls[0][0]).toStrictEqual(
      false,
    );
    expect(setUseCurrencyRateCheckStub.mock.calls[0][0]).toStrictEqual(false);

    // toggle back to true
    fireEvent.click(toggles[0]);
    fireEvent.click(toggles[1]);
    fireEvent.click(toggles[2]);
    fireEvent.click(toggles[3]);
    fireEvent.click(toggles[4]);
    fireEvent.click(submitButton);
    expect(setFeatureFlagStub).toHaveBeenCalledTimes(2);
    expect(setUsePhishDetectStub).toHaveBeenCalledTimes(2);
    expect(setUseTokenDetectionStub).toHaveBeenCalledTimes(2);
    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(2);
    expect(setUseCurrencyRateCheckStub).toHaveBeenCalledTimes(2);

    expect(setFeatureFlagStub.mock.calls[1][1]).toStrictEqual(true);
    expect(setUsePhishDetectStub.mock.calls[1][0]).toStrictEqual(true);
    expect(setUseTokenDetectionStub.mock.calls[1][0]).toStrictEqual(true);
    expect(setUseMultiAccountBalanceCheckerStub.mock.calls[1][0]).toStrictEqual(
      true,
    );
    expect(setUseCurrencyRateCheckStub.mock.calls[1][0]).toStrictEqual(true);
  });
});
