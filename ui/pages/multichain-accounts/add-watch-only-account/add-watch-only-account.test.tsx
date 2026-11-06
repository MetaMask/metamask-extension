import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';

import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { importWatchOnlyAccount } from '../../../store/actions';

import { AddWatchOnlyAccountPage } from './add-watch-only-account';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../components/ui/toast/toast', () => ({
  toast: {
    success: jest.fn(),
  },
  ToastContent: jest.fn(({ title, dataTestId }) => (
    <div data-testid={dataTestId}>{title}</div>
  )),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  importWatchOnlyAccount: jest.fn(),
}));

const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

const renderComponent = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<AddWatchOnlyAccountPage />, store);
};

describe('AddWatchOnlyAccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(importWatchOnlyAccount)
      .mockReturnValue(() => Promise.resolve(mockState.metamask) as never);
  });

  it('renders the page with title, description, address input and buttons', () => {
    renderComponent();

    expect(
      screen.getByText(messages.addWatchOnlyAccount.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.watchOnlyAccountDescription.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('watch-only-address-input')).toBeInTheDocument();
    expect(
      screen.getByTestId('watch-only-account-confirm-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('watch-only-account-cancel-button'),
    ).toBeInTheDocument();
  });

  it('disables the confirm button while the address is empty', () => {
    renderComponent();

    expect(
      screen.getByTestId('watch-only-account-confirm-button'),
    ).toBeDisabled();
  });

  it('shows an invalid address error and keeps the confirm button disabled for an invalid address', () => {
    renderComponent();

    fireEvent.change(screen.getByTestId('watch-only-address-input'), {
      target: { value: 'not-an-address' },
    });

    expect(
      screen.getByText(messages.invalidAddress.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('watch-only-account-confirm-button'),
    ).toBeDisabled();
  });

  it('adds the watch-only account, shows a success toast and navigates home', async () => {
    renderComponent();

    fireEvent.change(screen.getByTestId('watch-only-address-input'), {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.click(screen.getByTestId('watch-only-account-confirm-button'));

    await waitFor(() => {
      expect(importWatchOnlyAccount).toHaveBeenCalledWith(VALID_ADDRESS);
      expect(toast.success).toHaveBeenCalledWith(
        <ToastContent
          title={messages.watchOnlyAccountAdded.message}
          dataTestId="watch-only-account-added-toast"
        />,
        { id: 'watch-only-account-added-toast', duration: 5000 },
      );
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  it('shows an error and does not navigate when the account could not be added', async () => {
    jest
      .mocked(importWatchOnlyAccount)
      .mockReturnValue(() => Promise.reject(new Error('boom')) as never);

    renderComponent();

    fireEvent.change(screen.getByTestId('watch-only-address-input'), {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.click(screen.getByTestId('watch-only-account-confirm-button'));

    await waitFor(() => {
      expect(
        screen.getByText(messages.watchOnlyAccountAddError.message),
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('navigates back when the back button is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('add-watch-only-account-back-button'));

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('navigates back when the cancel button is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('watch-only-account-cancel-button'));

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });
});
