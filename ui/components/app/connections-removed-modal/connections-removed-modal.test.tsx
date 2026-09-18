import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { isPopupOrSidePanelEnvironment } from '../../../../shared/lib/environment-type';
import ConnectionsRemovedModal from './connections-removed-modal';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockResetWallet = jest.fn(() => Promise.resolve());

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  resetWallet: () => mockResetWallet,
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  isPopupOrSidePanelEnvironment: jest.fn(),
}));

const mockIsPopupOrSidePanelEnvironment = jest.mocked(
  isPopupOrSidePanelEnvironment,
);

const buildStore = () => configureMockStore([thunk])({ metamask: {} });

function renderModal() {
  return renderWithProvider(<ConnectionsRemovedModal />, buildStore());
}

describe('ConnectionsRemovedModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPopupOrSidePanelEnvironment.mockReturnValue(false);

    // @ts-expect-error test platform
    globalThis.platform = {
      openExtensionInBrowser: jest.fn(),
    };
  });

  describe('render', () => {
    it('renders the title, description, and confirm button', () => {
      renderModal();

      expect(
        screen.getByTestId('connections-removed-modal'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.connectionsRemovedModalTitle.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.connectionsRemovedModalDescription.message),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: messages.gotIt.message }),
      ).toBeInTheDocument();
    });
  });

  describe('confirm action', () => {
    it('resets the wallet and navigates in fullscreen', async () => {
      renderModal();

      fireEvent.click(screen.getByTestId('connections-removed-modal-button'));

      await waitFor(() => {
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
          replace: true,
        });
      });

      expect(globalThis.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('opens the extension in browser when confirming from popup', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal();

      fireEvent.click(screen.getByTestId('connections-removed-modal-button'));

      await waitFor(() => {
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          DEFAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('opens the extension in browser when confirming from side panel', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal();

      fireEvent.click(screen.getByTestId('connections-removed-modal-button'));

      await waitFor(() => {
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          DEFAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
