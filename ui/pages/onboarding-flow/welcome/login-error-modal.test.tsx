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
      <LoginErrorModal onClose={jest.fn()} loginError={LOGIN_ERROR.GENERIC} {...props} />
    </MetaMetricsContext.Provider>,
    buildStore(),
  );
}

describe('LoginErrorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPopupOrSidePanelEnvironment.mockReturnValue(false);
    mockGetSocialLoginType.mockReturnValue(undefined);

    // @ts-expect-error test platform
    global.platform = {
      openExtensionInBrowser: jest.fn(),
    };
  });

  describe('render', () => {
    it.each([
      [
        LOGIN_ERROR.UNABLE_TO_CONNECT,
        messages.loginErrorConnectTitle.message,
        messages.loginErrorConnectDescription.message,
        messages.loginErrorConnectButton.message,
      ],
      [
        LOGIN_ERROR.SESSION_EXPIRED,
        messages.loginErrorSessionExpiredTitle.message,
        messages.loginErrorSessionExpiredDescription.message,
        messages.loginErrorSessionExpiredButton.message,
      ],
    ])(
      'renders the %s content',
      (loginError, title, description, buttonText) => {
        renderModal({ loginError });

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: buttonText }),
        ).toBeInTheDocument();
      },
    );

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
    it('closes the modal, resets the wallet, and navigates in fullscreen', async () => {
      const onClose = jest.fn();

      renderModal({ onClose });

      fireEvent.click(screen.getByTestId('login-error-modal-button'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockResetWallet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
          replace: true,
        });
      });

      expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it.each(['popup', 'side panel'])(
      'opens the extension in browser after reset from the %s',
      async () => {
        mockIsPopupOrSidePanelEnvironment.mockReturnValue(true);

        renderModal();

        fireEvent.click(screen.getByTestId('login-error-modal-button'));

        await waitFor(() => {
          expect(mockResetWallet).toHaveBeenCalledTimes(1);
          expect(global.platform.openExtensionInBrowser).toHaveBeenCalledWith(
            DEFAULT_ROUTE,
          );
        });

        expect(mockNavigate).not.toHaveBeenCalled();
      },
    );
  });
});
