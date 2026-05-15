import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { SUPPORT_LINK } from '../../helpers/constants/common';
import {
  DEFAULT_ROUTE,
  RESTORE_VAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { isPopupOrSidePanelEnvironment } from '../../../shared/lib/environment-type';
import ResetPasswordModal from './reset-password-modal';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockMarkPasswordForgotten = jest.fn(() => Promise.resolve());
const mockResetWallet = jest.fn(() => Promise.resolve());
jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  markPasswordForgotten: () => mockMarkPasswordForgotten,
  resetWallet: () => mockResetWallet,
}));

const mockGetIsSocialLoginFlow = jest.fn().mockReturnValue(false);
jest.mock('../../selectors', () => ({
  ...jest.requireActual('../../selectors'),
  getIsSocialLoginFlow: (...args: unknown[]) =>
    mockGetIsSocialLoginFlow(...args),
}));

jest.mock('../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../shared/lib/environment-type'),
  isPopupOrSidePanelEnvironment: jest.fn(),
}));

const mockIsPopupOrSidePanelEnvironment = jest.mocked(
  isPopupOrSidePanelEnvironment,
);

const buildStore = () => configureMockStore([thunk])({ metamask: {} });

function renderModal(
  props: Partial<React.ComponentProps<typeof ResetPasswordModal>> = {},
  getMockTrackEvent = () => jest.fn().mockResolvedValue(undefined),
) {
  const store = buildStore();

  return renderWithProvider(
    <ResetPasswordModal onClose={jest.fn()} {...props} />,
    store,
    '/',
    undefined,
    getMockTrackEvent,
  );
}

describe('ResetPasswordModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsSocialLoginFlow.mockReturnValue(false);
    mockIsPopupOrSidePanelEnvironment.mockReturnValue(false);

    // @ts-expect-error mocking platform
    globalThis.platform = {
      openExtensionInBrowser: jest.fn(),
    };
  });

  describe('initial render', () => {
    it('renders the SRP recovery content by default', () => {
      renderModal();

      expect(
        screen.getByText(messages.forgotPasswordModalTitle.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.forgotPasswordModalDescription1.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.forgotPasswordModalDescription2.message),
      ).toBeInTheDocument();
    });

    it('renders the social recovery content when social login is enabled', () => {
      mockGetIsSocialLoginFlow.mockReturnValue(true);

      renderModal();

      expect(
        screen.getByText(messages.forgotPasswordSocialStep1Biometrics.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.secretRecoveryPhrase.message),
      ).toBeInTheDocument();
    });
  });

  describe('restore wallet action', () => {
    it('tracks the reset event, dispatches markPasswordForgotten, and navigates in fullscreen', async () => {
      const mockTrackEvent = jest.fn();

      renderModal({}, () => mockTrackEvent);

      fireEvent.click(screen.getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.ResetWallet,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: 'metamask',
          },
        });
        expect(mockMarkPasswordForgotten).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(RESTORE_VAULT_ROUTE, {
          replace: true,
        });
      });

      expect(globalThis.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('opens the extension in full screen when restoring from popup', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal();

      fireEvent.click(screen.getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(mockMarkPasswordForgotten).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          RESTORE_VAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('opens the extension in full screen when restoring from side panel', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal();

      fireEvent.click(screen.getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(mockMarkPasswordForgotten).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          RESTORE_VAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('tracks the social account type when social login is enabled', async () => {
      const mockTrackEvent = jest.fn();
      mockGetIsSocialLoginFlow.mockReturnValue(true);

      renderModal({}, () => mockTrackEvent);

      fireEvent.click(screen.getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.ResetWallet,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: 'social',
          },
        });
      });
    });
  });

  describe('reset wallet confirmation view', () => {
    function openResetWalletView() {
      renderModal();

      fireEvent.click(screen.getByTestId('reset-password-modal-button-link'));
    }

    it('switches to the reset wallet confirmation view and back', () => {
      openResetWalletView();

      expect(
        screen.getByText(messages.resetWalletTitle.message),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(messages.back.message));

      expect(
        screen.getByText(messages.forgotPasswordModalTitle.message),
      ).toBeInTheDocument();
    });

    it('closes the modal, dispatches resetWallet, and navigates in fullscreen', async () => {
      const onClose = jest.fn();

      renderModal({ onClose });

      fireEvent.click(screen.getByTestId('reset-password-modal-button-link'));
      fireEvent.click(screen.getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
          replace: true,
        });
      });

      expect(globalThis.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('opens the extension in browser after reset from popup', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal();

      fireEvent.click(screen.getByTestId('reset-password-modal-button-link'));
      fireEvent.click(screen.getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          DEFAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('opens the extension in browser after reset from side panel', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal();

      fireEvent.click(screen.getByTestId('reset-password-modal-button-link'));
      fireEvent.click(screen.getByTestId('reset-password-modal-button'));

      await waitFor(() => {
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          DEFAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('support link', () => {
    it('tracks the support link click', () => {
      const mockTrackEvent = jest.fn();

      renderModal({}, () => mockTrackEvent);

      fireEvent.click(
        screen.getByText(
          messages.forgotPasswordModalContactSupportLink.message,
        ),
      );

      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.SupportLinkClicked,
          properties: {
            url: SUPPORT_LINK,
          },
        },
        {
          contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
        },
      );
    });
  });

  describe('modal close', () => {
    it('calls onClose when the close button is clicked', () => {
      const onClose = jest.fn();

      renderModal({ onClose });

      fireEvent.click(screen.getByLabelText(messages.close.message));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
