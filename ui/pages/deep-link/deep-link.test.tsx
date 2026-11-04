import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { submitRequestToBackground } from '../../store/background-connection';
import { parse } from '../../../shared/lib/deep-links/parse';
import type { DeepLink as DeepLinkComponent } from './deep-link';

const mockAssign = jest.fn();
let DeepLink: typeof DeepLinkComponent;
const mockLocation = { search: '?u=%2Fhome%3Fref%3DABC&referralContext=one' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation,
}));
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));
jest.mock('../../hooks/useI18nContext', () => {
  const translate = (key: string) => key;
  return { useI18nContext: () => translate };
});
jest.mock('../../../shared/lib/deep-links/parse', () => ({ parse: jest.fn() }));
jest.mock('../../store/actions', () => ({
  setSkipDeepLinkInterstitial: () => ({ type: 'skip' }),
}));

function renderInterstitial(strict = false) {
  const store = configureStore({
    reducer: (state = { metamask: { preferences: {} } }) => state,
  });
  const element = (
    <Provider store={store}>
      <DeepLink />
    </Provider>
  );
  return render(
    strict ? <React.StrictMode>{element}</React.StrictMode> : element,
  );
}

describe('DeepLink referral continuation', () => {
  const originalLocation = window.location;
  beforeAll(() => {
    global.platform.getExtensionURL = (route = '/', query = '') =>
      `home.html#${route}${query ? `?${query}` : ''}`;
    // The page captures the platform helper at module initialization.
    ({ DeepLink } = jest.requireActual('./deep-link'));
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: mockAssign },
    });
  });
  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(submitRequestToBackground).mockResolvedValue(true);
    jest.mocked(parse).mockResolvedValue({
      signature: 'missing',
      route: { getTitle: () => 'home' },
      destination: { path: '/', query: new URLSearchParams() },
    } as never);
  });

  it('keeps the warning visible until Continue authorizes the captured context', async () => {
    renderInterstitial();
    await act(async () => undefined);
    expect(submitRequestToBackground).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByTestId('deep-link-continue-button'));
    });
    expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
      'RewardsMoneyController:continueReferralContext',
      ['one'],
    ]);
    expect(mockAssign).toHaveBeenCalledWith(
      expect.stringContaining('/referral-invite?context=one&'),
    );
  });

  it('drops context when the user leaves without continuing', async () => {
    const view = renderInterstitial();
    await act(async () => undefined);
    view.unmount();
    await act(async () => undefined);
    expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
      'RewardsMoneyController:dropReferralContext',
      ['one'],
    ]);
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it('does not drop context during StrictMode effect replay', async () => {
    renderInterstitial(true);
    await act(async () => undefined);
    expect(submitRequestToBackground).not.toHaveBeenCalled();
  });

  it('continues ordinary navigation when a newer link replaced the captured context', async () => {
    jest.mocked(submitRequestToBackground).mockResolvedValue(false);
    renderInterstitial();
    await act(async () => undefined);
    await act(async () => {
      fireEvent.click(screen.getByTestId('deep-link-continue-button'));
    });
    expect(mockAssign).toHaveBeenCalledTimes(1);
    expect(mockAssign.mock.calls[0][0]).not.toContain('referral-invite');
  });
});
