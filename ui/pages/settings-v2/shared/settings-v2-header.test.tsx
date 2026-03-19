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
        isPopup
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
        isPopup
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
        isPopup
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
        isPopup
        isOnSettingsRoot={false}
        onClose={onClose}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('settings-v2-header-back-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches to search mode when search is clicked', () => {
    const onSearchChange = jest.fn();

    renderWithProvider(
      <SettingsV2Header
        title={messages.settings.message}
        isPopup
        isOnSettingsRoot
        searchValue=""
        onSearchChange={onSearchChange}
        onSearchClear={jest.fn()}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('settings-v2-header-search-button'));

    expect(screen.getByTestId('settings-v2-header-search-input')).toBeVisible();
  });
});
