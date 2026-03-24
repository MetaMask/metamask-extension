import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { SettingsV2Header } from './settings-v2-header';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const createMockStore = () => configureMockStore([thunk])(mockState);

describe('SettingsV2Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and search button at settings root', () => {
    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isPopupOrSidepanel
        isOnSettingsRoot
        searchValue=""
      />,
      createMockStore(),
    );

    expect(screen.getByText(messages.settings.message)).toBeInTheDocument();
    expect(
      screen.getByTestId('settings-v2-header-search-button'),
    ).toBeVisible();
  });

  it('renders close button in end accessory for popup subpages', () => {
    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isPopupOrSidepanel
        isOnSettingsRoot={false}
      />,
      createMockStore(),
    );

    expect(
      screen.queryByTestId('settings-v2-header-search-button'),
    ).not.toBeInTheDocument();
  });

  it('navigates to default route when close button is clicked on popup subpage', () => {
    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isPopupOrSidepanel
        isOnSettingsRoot={false}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('settings-v2-header-close-button'));

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('calls onClose when back button is clicked', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isPopupOrSidepanel
        isOnSettingsRoot={false}
        onClose={onClose}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('settings-v2-header-back-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSearch when search button is clicked', () => {
    const onOpenSearch = jest.fn();
    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isPopupOrSidepanel
        isOnSettingsRoot
        onOpenSearch={onOpenSearch}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('settings-v2-header-search-button'));

    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('renders search input when isSearchOpen is true', () => {
    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isSearchOpen
        searchValue=""
        onSearchChange={jest.fn()}
        onSearchClear={jest.fn()}
      />,
      createMockStore(),
    );

    expect(screen.getByTestId('settings-v2-header-search-input')).toBeVisible();
    expect(
      screen.queryByText(messages.settings.message),
    ).not.toBeInTheDocument();
  });

  it('calls onCloseSearch and onSearchClear when close is clicked in search mode', () => {
    const onCloseSearch = jest.fn();
    const onSearchClear = jest.fn();
    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isSearchOpen
        searchValue="test"
        onCloseSearch={onCloseSearch}
        onSearchClear={onSearchClear}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByLabelText(messages.close.message));

    expect(onCloseSearch).toHaveBeenCalledTimes(1);
    expect(onSearchClear).toHaveBeenCalledTimes(1);
  });
});
