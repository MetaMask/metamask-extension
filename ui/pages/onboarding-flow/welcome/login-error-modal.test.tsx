import React from 'react';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { SUPPORT_LINK } from '../../../helpers/constants/common';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { isPopupOrSidePanelEnvironment } from '../../../../shared/lib/environment-type';
import { getSocialLoginType } from '../../../selectors';
import LoginErrorModal from './login-error-modal';
import { LOGIN_ERROR } from './types';

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

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getSocialLoginType: jest.fn(),
}));

const mockIsPopupOrSidePanelEnvironment = jest.mocked(
  isPopupOrSidePanelEnvironment,
);
const mockGetSocialLoginType = jest.mocked(getSocialLoginType);
const TELEGRAM_DESKTOP_UPDATE_URL = 'https://desktop.telegram.org/';

const buildStore = () => configureMockStore([thunk])({ metamask: {} });

function renderModal(
  props: Partial<React.ComponentProps<typeof LoginErrorModal>> = {},
  trackEvent = jest.fn(),
) {
  const mockMetaMetricsContext = {
    trackEvent,
    bufferedTrace: jest.fn(),
    bufferedEndTrace: jest.fn(),
    onboardingParentContext: { current: null },
  };

  return renderWithProvider(
    <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
      <LoginErrorModal
        onClose={jest.fn()}
        loginError={LOGIN_ERROR.GENERIC}
        {...props}
      />
    </MetaMetricsContext.Provider>,
    buildStore(),
  );
}

function expectErrorContent({
  loginError,
  title,
  description,
  buttonText,
}: {
  loginError: React.ComponentProps<typeof LoginErrorModal>['loginError'];
  title: string;
  description: string;
  buttonText: string;
}) {
  renderModal({ loginError });

  expect(screen.getByText(title)).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: buttonText })).toBeInTheDocument();
}

describe('LoginErrorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPopupOrSidePanelEnvironment.mockReturnValue(false);
    mockGetSocialLoginType.mockReturnValue(undefined);

    // @ts-expect-error test platform
    globalThis.platform = {
      openExtensionInBrowser: jest.fn(),
      openTab: jest.fn(),
    };
  });

  describe('render', () => {
    it('renders the unable to connect content', () => {
      expectErrorContent({
        loginError: LOGIN_ERROR.UNABLE_TO_CONNECT,
        title: messages.loginErrorConnectTitle.message,
        description: messages.loginErrorConnectDescription.message,
        buttonText: messages.loginErrorConnectButton.message,
      });
    });

    it('renders the session expired content', () => {
      expectErrorContent({
        loginError: LOGIN_ERROR.SESSION_EXPIRED,
        title: messages.loginErrorSessionExpiredTitle.message,
        description: messages.loginErrorSessionExpiredDescription.message,
        buttonText: messages.loginErrorSessionExpiredButton.message,
      });
    });

    it('renders the reset wallet description with the social login type', () => {
      mockGetSocialLoginType.mockReturnValue(AuthConnection.Google);

      renderModal({ loginError: LOGIN_ERROR.RESET_WALLET });

      expect(
        screen.getByText(
          tEn('loginErrorResetWalletDescription', [AuthConnection.Google]),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: messages.loginErrorGenericButton.message,
        }),
      ).toBeInTheDocument();
    });

    it('renders the generic support link', () => {
      renderModal({ loginError: LOGIN_ERROR.GENERIC });

      expect(
        screen.getByText(messages.loginErrorGenericTitle.message),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: messages.loginErrorGenericButton.message,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', {
          name: messages.loginErrorGenericSupport.message,
        }),
      ).toHaveAttribute('href', SUPPORT_LINK);
    });

    it('renders the Telegram outdated content', () => {
      expectErrorContent({
        loginError: LOGIN_ERROR.TELEGRAM_OUTDATED,
        title: messages.loginErrorTelegramOutdatedTitle.message,
        description: messages.loginErrorTelegramOutdatedDescription.message,
        buttonText: messages.loginErrorTelegramOutdatedButton.message,
      });
    });
  });

  describe('support link', () => {
    it('tracks the support link click for the generic error', () => {
      const mockTrackEvent = jest.fn();

      renderModal({ loginError: LOGIN_ERROR.GENERIC }, mockTrackEvent);

      fireEvent.click(
        screen.getByRole('link', {
          name: messages.loginErrorGenericSupport.message,
        }),
      );

      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.SupportLinkClicked,
          properties: {
            url: SUPPORT_LINK,
            location: 'Welcome page',
          },
        },
        {
          contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
        },
      );
    });
  });

  describe('confirm action', () => {
    it('closes the modal without resetting the wallet for recoverable errors', () => {
      const onClose = jest.fn();

      renderModal({
        onClose,
        loginError: LOGIN_ERROR.UNABLE_TO_CONNECT,
      });

      fireEvent.click(screen.getByTestId('login-error-modal-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockResetWallet).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(globalThis.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('closes the modal, resets the wallet, and navigates in fullscreen for reset wallet errors', async () => {
      const onClose = jest.fn();

      renderModal({
        onClose,
        loginError: LOGIN_ERROR.RESET_WALLET,
      });

      fireEvent.click(screen.getByTestId('login-error-modal-button'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
          replace: true,
        });
      });

      expect(globalThis.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('opens the extension in browser after reset from popup for reset wallet errors', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal({ loginError: LOGIN_ERROR.RESET_WALLET });

      fireEvent.click(screen.getByTestId('login-error-modal-button'));

      await waitFor(() => {
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          DEFAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('opens the extension in browser after reset from side panel for reset wallet errors', async () => {
      mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

      renderModal({ loginError: LOGIN_ERROR.RESET_WALLET });

      fireEvent.click(screen.getByTestId('login-error-modal-button'));

      await waitFor(() => {
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(globalThis.platform.openExtensionInBrowser).toHaveBeenCalledWith(
          DEFAULT_ROUTE,
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('tracks the Telegram update CTA, opens the Telegram site, and closes the modal', () => {
      const onClose = jest.fn();
      const mockTrackEvent = jest.fn();

      renderModal(
        {
          onClose,
          loginError: LOGIN_ERROR.TELEGRAM_OUTDATED,
        },
        mockTrackEvent,
      );

      fireEvent.click(
        screen.getByTestId('login-error-modal-update-telegram-button'),
      );

      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: TELEGRAM_DESKTOP_UPDATE_URL,
          location: 'Telegram outdated modal',
        },
      });
      expect(globalThis.platform.openTab).toHaveBeenCalledWith({
        url: TELEGRAM_DESKTOP_UPDATE_URL,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockResetWallet).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(globalThis.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });
  });
});
