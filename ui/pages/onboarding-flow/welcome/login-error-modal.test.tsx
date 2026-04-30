import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import LoginErrorModal from './login-error-modal';
import { LOGIN_ERROR, LoginErrorType } from './types';

const TELEGRAM_DESKTOP_UPDATE_URL = 'https://desktop.telegram.org/';

const buildState = (authConnection?: string) => ({
  metamask: {
    internalAccounts: { accounts: {}, selectedAccount: '' },
    metaMetricsId: '0x00000000',
    authConnection,
  },
});

describe('LoginErrorModal', () => {
  const mockOnDone = jest.fn();
  const mockTrackEvent = jest.fn();
  const mockMetaMetricsContext = {
    trackEvent: mockTrackEvent,
    bufferedTrace: jest.fn(),
    bufferedEndTrace: jest.fn(),
    onboardingParentContext: { current: null },
  };

  const renderModal = (
    loginError: LoginErrorType,
    { authConnection }: { authConnection?: string } = {},
  ) => {
    const store = configureMockStore([thunk])(buildState(authConnection));

    return renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <LoginErrorModal onDone={mockOnDone} loginError={loginError} />
      </MetaMetricsContext.Provider>,
      store,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error mocking platform
    global.platform = { openTab: jest.fn() };
  });

  it('renders the unable-to-connect title and CTA', () => {
    const { getByText } = renderModal(LOGIN_ERROR.UNABLE_TO_CONNECT);

    expect(
      getByText(messages.loginErrorConnectTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.loginErrorConnectButton.message),
    ).toBeInTheDocument();
  });

  it('renders the session-expired title and CTA', () => {
    const { getByText } = renderModal(LOGIN_ERROR.SESSION_EXPIRED);

    expect(
      getByText(messages.loginErrorSessionExpiredTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.loginErrorSessionExpiredButton.message),
    ).toBeInTheDocument();
  });

  it('renders the generic title and CTA', () => {
    const { getByText } = renderModal(LOGIN_ERROR.GENERIC);

    expect(
      getByText(messages.loginErrorGenericTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.loginErrorGenericButton.message),
    ).toBeInTheDocument();
  });

  it('calls onDone when the default CTA is clicked', () => {
    const { getByTestId } = renderModal(LOGIN_ERROR.UNABLE_TO_CONNECT);

    fireEvent.click(getByTestId('login-error-modal-button'));

    expect(mockOnDone).toHaveBeenCalledTimes(1);
  });

  it('renders a RESET_WALLET description that includes the social login type', () => {
    const { getByText } = renderModal(LOGIN_ERROR.RESET_WALLET, {
      authConnection: 'google',
    });

    expect(getByText(/Re-login with google/iu)).toBeInTheDocument();
  });

  describe('when loginError is TELEGRAM_OUTDATED', () => {
    it('renders the Telegram-specific title, description and Update Telegram CTA', () => {
      const { getByText, getByTestId, queryByTestId } = renderModal(
        LOGIN_ERROR.TELEGRAM_OUTDATED,
      );

      expect(
        getByText(messages.loginErrorTelegramOutdatedTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(messages.loginErrorTelegramOutdatedDescription.message),
      ).toBeInTheDocument();
      expect(
        getByTestId('login-error-modal-update-telegram-button'),
      ).toBeInTheDocument();
      // The default CTA must be replaced, not added alongside.
      expect(queryByTestId('login-error-modal-button')).not.toBeInTheDocument();
    });

    it('opens the Telegram desktop URL, tracks the event, and dismisses the modal when the CTA is clicked', () => {
      const { getByTestId } = renderModal(LOGIN_ERROR.TELEGRAM_OUTDATED);

      fireEvent.click(getByTestId('login-error-modal-update-telegram-button'));

      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: TELEGRAM_DESKTOP_UPDATE_URL,
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: TELEGRAM_DESKTOP_UPDATE_URL,
          location: 'Telegram outdated modal',
        },
      });
      expect(mockOnDone).toHaveBeenCalledTimes(1);
    });
  });
});
