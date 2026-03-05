import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { ShowExtensionItem } from './show-extension-item';

const mockSetShowExtensionInFullSizeView = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setShowExtensionInFullSizeView: (val: boolean) => {
    mockSetShowExtensionInFullSizeView(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('ShowExtensionItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<ShowExtensionItem />, mockStore);

    expect(
      screen.getByText(messages.showExtensionInFullSizeView.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithProvider(<ShowExtensionItem />, mockStore);

    expect(
      screen.getByText(messages.showExtensionInFullSizeViewDescription.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showExtensionInFullSizeView: true,
        },
      },
    });
    renderWithProvider(<ShowExtensionItem />, storeEnabled);

    expect(
      screen.getByTestId('show-extension-in-full-size-view'),
    ).toHaveAttribute('value', 'true');
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showExtensionInFullSizeView: false,
        },
      },
    });
    renderWithProvider(<ShowExtensionItem />, storeDisabled);

    expect(
      screen.getByTestId('show-extension-in-full-size-view'),
    ).toHaveAttribute('value', 'false');
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showExtensionInFullSizeView: true,
        },
      },
    });
    renderWithProvider(<ShowExtensionItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('show-extension-in-full-size-view'));

    expect(mockSetShowExtensionInFullSizeView).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showExtensionInFullSizeView: false,
        },
      },
    });
    renderWithProvider(<ShowExtensionItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('show-extension-in-full-size-view'));

    expect(mockSetShowExtensionInFullSizeView).toHaveBeenCalledWith(true);
  });
});
