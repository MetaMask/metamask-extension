import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { PageHeaderWithSearch } from './page-header-with-search';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const createMockStore = () => configureMockStore([thunk])(mockState);

describe('PageHeaderWithSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title and search button by default', () => {
    renderWithProvider(
      <PageHeaderWithSearch title={messages.settings.message} />,
      createMockStore(),
    );

    expect(screen.getByText(messages.settings.message)).toBeInTheDocument();
    expect(screen.getByTestId('page-header-search-button')).toBeVisible();
  });

  it('renders the close button instead of the search button when endAction is close', () => {
    renderWithProvider(
      <PageHeaderWithSearch
        title={messages.settings.message}
        endAction="close"
      />,
      createMockStore(),
    );

    expect(screen.getByTestId('page-header-close-button')).toBeVisible();
    expect(
      screen.queryByTestId('page-header-search-button'),
    ).not.toBeInTheDocument();
  });

  it('navigates to the default route when the close button is clicked', () => {
    renderWithProvider(
      <PageHeaderWithSearch
        title={messages.settings.message}
        endAction="close"
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('page-header-close-button'));

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = jest.fn();
    renderWithProvider(
      <PageHeaderWithSearch
        title={messages.settings.message}
        onBack={onBack}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('page-header-back-button'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSearch when search button is clicked', () => {
    const onOpenSearch = jest.fn();
    renderWithProvider(
      <PageHeaderWithSearch
        title={messages.settings.message}
        onOpenSearch={onOpenSearch}
      />,
      createMockStore(),
    );

    fireEvent.click(screen.getByTestId('page-header-search-button'));

    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('renders search input when isSearchOpen is true', () => {
    renderWithProvider(
      <PageHeaderWithSearch
        title={messages.settings.message}
        isSearchOpen
        searchValue=""
        onSearchChange={jest.fn()}
        onSearchClear={jest.fn()}
      />,
      createMockStore(),
    );

    expect(screen.getByTestId('page-header-search-input')).toBeVisible();
    expect(
      screen.queryByText(messages.settings.message),
    ).not.toBeInTheDocument();
  });

  it('calls onCloseSearch and onSearchClear when close is clicked in search mode', () => {
    const onCloseSearch = jest.fn();
    const onSearchClear = jest.fn();
    renderWithProvider(
      <PageHeaderWithSearch
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
