import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { ThemeType } from '../../../../shared/constants/preferences';
import * as Environment from '../../../../shared/lib/environment';
import LoginOptions from './login-options';
import { LOGIN_OPTION, LOGIN_TYPE } from './types';

const buildStore = () =>
  configureMockStore([thunk])({
    metamask: {
      internalAccounts: { accounts: {}, selectedAccount: '' },
      theme: ThemeType.light,
    },
  });

describe('LoginOptions', () => {
  const mockHandleLogin = jest.fn();

  beforeEach(() => {
    jest.restoreAllMocks();
    mockHandleLogin.mockClear();
    jest
      .spyOn(Environment, 'getIsTelegramLoginFeatureEnabled')
      .mockReturnValue(false);
  });

  describe('when Telegram login is enabled', () => {
    beforeEach(() => {
      jest
        .spyOn(Environment, 'getIsTelegramLoginFeatureEnabled')
        .mockReturnValue(true);
    });

    it('renders create-with buttons for Google, Apple, Telegram and an SRP button', () => {
      const { getByTestId, getByText } = renderWithProvider(
        <LoginOptions
          loginOption={LOGIN_OPTION.NEW}
          handleLogin={mockHandleLogin}
        />,
        buildStore(),
      );

      expect(
        getByTestId('onboarding-create-with-google-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-create-with-apple-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-create-with-telegram-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-create-with-srp-button'),
      ).toBeInTheDocument();

      expect(
        getByText(tEn('onboardingContinueWith', ['Google'])),
      ).toBeInTheDocument();
      expect(
        getByText(tEn('onboardingContinueWith', ['Apple'])),
      ).toBeInTheDocument();
      expect(
        getByText(tEn('onboardingContinueWith', ['Telegram'])),
      ).toBeInTheDocument();
      expect(
        getByText(messages.onboardingSrpCreate.message),
      ).toBeInTheDocument();
    });

    it('renders import-with buttons for Google, Apple, Telegram and an SRP button', () => {
      const { getByTestId, getByText } = renderWithProvider(
        <LoginOptions
          loginOption={LOGIN_OPTION.EXISTING}
          handleLogin={mockHandleLogin}
        />,
        buildStore(),
      );

      expect(
        getByTestId('onboarding-import-with-google-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-import-with-apple-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-import-with-telegram-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-import-with-srp-button'),
      ).toBeInTheDocument();

      expect(
        getByText(tEn('onboardingSignInWith', ['Google'])),
      ).toBeInTheDocument();
      expect(
        getByText(tEn('onboardingSignInWith', ['Apple'])),
      ).toBeInTheDocument();
      expect(
        getByText(tEn('onboardingSignInWith', ['Telegram'])),
      ).toBeInTheDocument();
      expect(
        getByText(messages.onboardingSrpImport.message),
      ).toBeInTheDocument();
    });

    it('calls handleLogin with the correct LOGIN_TYPE for each button', () => {
      const { getByTestId } = renderWithProvider(
        <LoginOptions
          loginOption={LOGIN_OPTION.NEW}
          handleLogin={mockHandleLogin}
        />,
        buildStore(),
      );

      fireEvent.click(getByTestId('onboarding-create-with-google-button'));
      fireEvent.click(getByTestId('onboarding-create-with-apple-button'));
      fireEvent.click(getByTestId('onboarding-create-with-telegram-button'));
      fireEvent.click(getByTestId('onboarding-create-with-srp-button'));

      expect(mockHandleLogin).toHaveBeenNthCalledWith(1, LOGIN_TYPE.GOOGLE);
      expect(mockHandleLogin).toHaveBeenNthCalledWith(2, LOGIN_TYPE.APPLE);
      expect(mockHandleLogin).toHaveBeenNthCalledWith(3, LOGIN_TYPE.TELEGRAM);
      expect(mockHandleLogin).toHaveBeenNthCalledWith(4, LOGIN_TYPE.SRP);
      expect(mockHandleLogin).toHaveBeenCalledTimes(4);
    });
  });

  describe('when Telegram login is disabled', () => {
    it('renders only Google, Apple, and SRP buttons', () => {
      const { getByTestId, getByText, queryByTestId, queryByText } =
        renderWithProvider(
          <LoginOptions
            loginOption={LOGIN_OPTION.NEW}
            handleLogin={mockHandleLogin}
          />,
          buildStore(),
        );

      expect(
        getByTestId('onboarding-create-with-google-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-create-with-apple-button'),
      ).toBeInTheDocument();
      expect(
        getByTestId('onboarding-create-with-srp-button'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('onboarding-create-with-telegram-button'),
      ).not.toBeInTheDocument();

      expect(
        getByText(tEn('onboardingContinueWith', ['Google'])),
      ).toBeInTheDocument();
      expect(
        getByText(tEn('onboardingContinueWith', ['Apple'])),
      ).toBeInTheDocument();
      expect(
        queryByText(tEn('onboardingContinueWith', ['Telegram'])),
      ).not.toBeInTheDocument();
    });

    it('calls handleLogin for Google, Apple, and SRP only', () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <LoginOptions
          loginOption={LOGIN_OPTION.NEW}
          handleLogin={mockHandleLogin}
        />,
        buildStore(),
      );

      fireEvent.click(getByTestId('onboarding-create-with-google-button'));
      fireEvent.click(getByTestId('onboarding-create-with-apple-button'));
      fireEvent.click(getByTestId('onboarding-create-with-srp-button'));

      expect(
        queryByTestId('onboarding-create-with-telegram-button'),
      ).not.toBeInTheDocument();
      expect(mockHandleLogin).toHaveBeenNthCalledWith(1, LOGIN_TYPE.GOOGLE);
      expect(mockHandleLogin).toHaveBeenNthCalledWith(2, LOGIN_TYPE.APPLE);
      expect(mockHandleLogin).toHaveBeenNthCalledWith(3, LOGIN_TYPE.SRP);
      expect(mockHandleLogin).toHaveBeenCalledTimes(3);
    });
  });

  it('renders Terms of Use and Privacy Notice footer links pointing to consensys.io', () => {
    const { getByRole } = renderWithProvider(
      <LoginOptions
        loginOption={LOGIN_OPTION.NEW}
        handleLogin={mockHandleLogin}
      />,
      buildStore(),
    );

    const termsLink = getByRole('link', {
      name: new RegExp(messages.onboardingLoginFooterTermsOfUse.message, 'iu'),
    });
    const privacyLink = getByRole('link', {
      name: new RegExp(
        messages.onboardingLoginFooterPrivacyNotice.message,
        'iu',
      ),
    });

    expect(termsLink).toHaveAttribute(
      'href',
      'https://consensys.io/terms-of-use',
    );
    expect(termsLink).toHaveAttribute('target', '_blank');
    expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(privacyLink).toHaveAttribute(
      'href',
      'https://consensys.io/privacy-notice',
    );
    expect(privacyLink).toHaveAttribute('target', '_blank');
    expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
