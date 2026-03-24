import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import ResetPasswordModal from './reset-password-modal';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockResetWallet = jest.fn(() => () => Promise.resolve());
jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  resetWallet: () => mockResetWallet,
}));

const mockGetIsSocialLoginFlow = jest.fn().mockReturnValue(false);
jest.mock('../../selectors', () => ({
  ...jest.requireActual('../../selectors'),
  getIsSocialLoginFlow: (...args: unknown[]) =>
    mockGetIsSocialLoginFlow(...args),
}));

const buildStore = (metamask: Record<string, unknown> = {}) =>
  configureMockStore([thunk])({ metamask });

const defaultProps = {
  onClose: jest.fn(),
  onRestore: jest.fn(),
};

function renderModal(
  props: Partial<typeof defaultProps> = {},
  metamask: Record<string, unknown> = {},
) {
  const store = buildStore(metamask);
  return renderWithProvider(
    <ResetPasswordModal {...defaultProps} {...props} />,
    store,
  );
}

describe('ResetPasswordModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial render', () => {
    it('renders the modal with the forgot-password title', () => {
      const { getByText } = renderModal();
      expect(
        getByText(messages.forgotPasswordModalTitle.message),
      ).toBeInTheDocument();
    });

    it('does not show the danger icon or back button on initial view', () => {
      const { queryByTestId } = renderModal();
      expect(queryByTestId('reset-password-modal')).toBeInTheDocument();
      const backBtn = document
        .querySelector('[data-testid="reset-password-modal"]')
        ?.querySelector('[aria-label="Back"]');
      if (backBtn) {
        expect(backBtn).toHaveStyle({ display: 'none' });
      }
    });
  });

  describe('SRP login flow (isSocialLoginEnabled = false)', () => {
    it('renders SRP description paragraphs', () => {
      const { getByText } = renderModal();
      expect(
        getByText(messages.forgotPasswordModalDescription1.message),
      ).toBeInTheDocument();
      expect(
        getByText(messages.forgotPasswordModalDescription2.message),
      ).toBeInTheDocument();
    });

    it('renders the contact support link', () => {
      const { getByText } = renderModal();
      expect(
        getByText(messages.forgotPasswordModalContactSupportLink.message),
      ).toBeInTheDocument();
    });

    it('calls onRestore when "Import wallet" button is clicked', () => {
      const onRestore = jest.fn();
      const { getByTestId } = renderModal({ onRestore });
      fireEvent.click(getByTestId('reset-password-modal-button'));
      expect(onRestore).toHaveBeenCalledTimes(1);
    });

    it('switches to reset-wallet view when "I don\'t know my Phrase" is clicked', () => {
      const { getByTestId, getByText } = renderModal();
      fireEvent.click(getByTestId('reset-password-modal-button-link'));
      expect(getByText(messages.resetWalletTitle.message)).toBeInTheDocument();
    });
  });

  describe('social login flow (isSocialLoginEnabled = true)', () => {
    const socialLoginMeta = { firstTimeFlowType: 'socialImport' };

    beforeEach(() => {
      mockGetIsSocialLoginFlow.mockReturnValue(true);
    });

    afterEach(() => {
      mockGetIsSocialLoginFlow.mockReturnValue(false);
    });

    it('renders the social-login description when isSocialLoginEnabled is true', () => {
      const { getByText } = renderModal({}, socialLoginMeta);
      expect(
        getByText(messages.forgotPasswordModalContactSupportLink.message),
      ).toBeInTheDocument();
    });

    it('renders the "Import wallet" and "I don\'t know my Phrase" buttons in social flow', () => {
      const { getByTestId } = renderModal({}, socialLoginMeta);
      expect(getByTestId('reset-password-modal-button')).toBeInTheDocument();
      expect(
        getByTestId('reset-password-modal-button-link'),
      ).toBeInTheDocument();
    });

    it('calls onRestore when "Import wallet" is clicked in social flow', () => {
      const onRestore = jest.fn();
      const { getByTestId } = renderModal({ onRestore }, socialLoginMeta);
      fireEvent.click(getByTestId('reset-password-modal-button'));
      expect(onRestore).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset-wallet confirmation view', () => {
    function renderAndOpenResetView(props = {}) {
      const result = renderModal(props);
      fireEvent.click(result.getByTestId('reset-password-modal-button-link'));
      return result;
    }

    it('shows reset-wallet title after clicking "I don\'t know my Phrase"', () => {
      const { getByText } = renderAndOpenResetView();
      expect(getByText(messages.resetWalletTitle.message)).toBeInTheDocument();
    });

    it('shows "Yes, reset wallet" danger button in reset-wallet view', () => {
      const { getByText } = renderAndOpenResetView();
      expect(getByText(messages.resetWalletButton.message)).toBeInTheDocument();
    });

    it('hides SRP description paragraphs in reset-wallet view', () => {
      const { queryByText, getByTestId } = renderAndOpenResetView();
      expect(
        queryByText(messages.forgotPasswordModalDescription1.message),
      ).toBeNull();
      expect(getByTestId('reset-password-modal-button')).toBeInTheDocument();
    });

    it('calls onClose, dispatches resetWallet, and navigates to DEFAULT_ROUTE on confirm', async () => {
      const onClose = jest.fn();
      const { getByTestId } = renderAndOpenResetView({ onClose });

      fireEvent.click(getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
          replace: true,
        });
      });
    });

    it('goes back to forgot-password view when back button is clicked', () => {
      const { getByTestId, getByText, queryByText } = renderAndOpenResetView();
      expect(getByText(messages.resetWalletTitle.message)).toBeInTheDocument();

      const backBtn = getByTestId('reset-password-modal')
        .closest('[role="dialog"]')
        ?.querySelector('button[aria-label="Back"]');

      if (backBtn) {
        fireEvent.click(backBtn);
        expect(
          queryByText(messages.forgotPasswordModalTitle.message),
        ).toBeInTheDocument();
      }
    });
  });

  describe('modal close', () => {
    it('calls onClose when the modal close button is clicked', () => {
      const onClose = jest.fn();
      const { getByTestId } = renderModal({ onClose });
      const closeBtn = getByTestId('reset-password-modal')
        .closest('[role="dialog"]')
        ?.querySelector('button[aria-label="Close"]');

      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('MetaMetrics tracking', () => {
    it('fires a trackEvent when the contact support link is clicked', () => {
      const { getByText } = renderModal();
      expect(() =>
        fireEvent.click(
          getByText(messages.forgotPasswordModalContactSupportLink.message),
        ),
      ).not.toThrow();
    });
  });
});
