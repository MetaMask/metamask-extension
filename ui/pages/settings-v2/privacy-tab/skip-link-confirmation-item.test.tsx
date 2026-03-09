import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { SkipLinkConfirmationToggleItem } from './skip-link-confirmation-item';

const mockSetSkipDeepLinkInterstitial = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setSkipDeepLinkInterstitial: (val: boolean) => {
    mockSetSkipDeepLinkInterstitial(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('SkipLinkConfirmationToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    renderWithProvider(<SkipLinkConfirmationToggleItem />, mockStore);

    expect(
      screen.getByText(messages.skipLinkConfirmationScreens.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    renderWithProvider(<SkipLinkConfirmationToggleItem />, mockStore);

    expect(
      screen.getByText(messages.skipLinkConfirmationScreensDescription.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          skipDeepLinkInterstitial: true,
        },
      },
    });
    renderWithProvider(<SkipLinkConfirmationToggleItem />, storeEnabled);

    expect(screen.getByTestId('skip-link-confirmation-toggle')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          skipDeepLinkInterstitial: false,
        },
      },
    });
    renderWithProvider(<SkipLinkConfirmationToggleItem />, storeDisabled);

    expect(screen.getByTestId('skip-link-confirmation-toggle')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          skipDeepLinkInterstitial: true,
        },
      },
    });
    renderWithProvider(<SkipLinkConfirmationToggleItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('skip-link-confirmation-toggle'));

    expect(mockSetSkipDeepLinkInterstitial).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          skipDeepLinkInterstitial: false,
        },
      },
    });
    renderWithProvider(<SkipLinkConfirmationToggleItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('skip-link-confirmation-toggle'));

    expect(mockSetSkipDeepLinkInterstitial).toHaveBeenCalledWith(true);
  });
});
