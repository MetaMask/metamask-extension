import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { ThemeType } from '../../../../shared/constants/preferences';
import LoginOptions from './login-options';
import { LOGIN_OPTION, LOGIN_TYPE, LoginOptionType } from './types';

const buildStore = () =>
  configureMockStore([thunk])({
    metamask: {
      internalAccounts: { accounts: {}, selectedAccount: '' },
      theme: ThemeType.light,
    },
  });

describe('LoginOptions', () => {
  const mockHandleLogin = jest.fn();
  type ButtonPrefix = 'create' | 'import';
  type RenderScenario = {
    loginOption: LoginOptionType;
    buttonPrefix: ButtonPrefix;
    socialLabelKey: 'onboardingContinueWith' | 'onboardingSignInWith';
    srpLabel: string;
  };

  const renderComponent = (loginOption: LoginOptionType = LOGIN_OPTION.NEW) =>
    renderWithProvider(
      <LoginOptions loginOption={loginOption} handleLogin={mockHandleLogin} />,
      buildStore(),
    );

  const socialButtons = [
    {
      name: 'Google',
      loginType: LOGIN_TYPE.GOOGLE,
      testIdSuffix: 'google',
    },
    {
      name: 'Apple',
      loginType: LOGIN_TYPE.APPLE,
      testIdSuffix: 'apple',
    },
    {
      name: 'Telegram',
      loginType: LOGIN_TYPE.TELEGRAM,
      testIdSuffix: 'telegram',
    },
  ];

  beforeEach(() => {
    jest.restoreAllMocks();
    mockHandleLogin.mockClear();
  });

  const assertLoginActionsRendered = ({
    loginOption,
    buttonPrefix,
    socialLabelKey,
    srpLabel,
  }: RenderScenario) => {
    const { getByTestId, getByText } = renderComponent(loginOption);

    socialButtons.forEach(({ name, testIdSuffix }) => {
      expect(
        getByTestId(`onboarding-${buttonPrefix}-with-${testIdSuffix}-button`),
      ).toBeInTheDocument();
      expect(getByText(tEn(socialLabelKey, [name]))).toBeInTheDocument();
    });

    expect(
      getByTestId(`onboarding-${buttonPrefix}-with-srp-button`),
    ).toBeInTheDocument();
    expect(getByText(srpLabel)).toBeInTheDocument();
  };

  const assertHandleLoginCalls = ({
    loginOption,
    buttonPrefix,
  }: Pick<RenderScenario, 'loginOption' | 'buttonPrefix'>) => {
    const { getByTestId } = renderComponent(loginOption);

    fireEvent.click(
      getByTestId(`onboarding-${buttonPrefix}-with-google-button`),
    );
    fireEvent.click(
      getByTestId(`onboarding-${buttonPrefix}-with-apple-button`),
    );
    fireEvent.click(
      getByTestId(`onboarding-${buttonPrefix}-with-telegram-button`),
    );
    fireEvent.click(getByTestId(`onboarding-${buttonPrefix}-with-srp-button`));

    expect(mockHandleLogin).toHaveBeenNthCalledWith(1, LOGIN_TYPE.GOOGLE);
    expect(mockHandleLogin).toHaveBeenNthCalledWith(2, LOGIN_TYPE.APPLE);
    expect(mockHandleLogin).toHaveBeenNthCalledWith(3, LOGIN_TYPE.TELEGRAM);
    expect(mockHandleLogin).toHaveBeenNthCalledWith(4, LOGIN_TYPE.SRP);
    expect(mockHandleLogin).toHaveBeenCalledTimes(4);
  };

  it('renders all login actions for the new flow', () => {
    assertLoginActionsRendered({
      loginOption: LOGIN_OPTION.NEW,
      buttonPrefix: 'create',
      socialLabelKey: 'onboardingContinueWith',
      srpLabel: messages.onboardingSrpCreate.message,
    });
  });

  it('renders all login actions for the existing flow', () => {
    assertLoginActionsRendered({
      loginOption: LOGIN_OPTION.EXISTING,
      buttonPrefix: 'import',
      socialLabelKey: 'onboardingSignInWith',
      srpLabel: messages.onboardingSrpImport.message,
    });
  });

  it('calls handleLogin with the correct login types for the new flow', () => {
    assertHandleLoginCalls({
      loginOption: LOGIN_OPTION.NEW,
      buttonPrefix: 'create',
    });
  });

  it('calls handleLogin with the correct login types for the existing flow', () => {
    assertHandleLoginCalls({
      loginOption: LOGIN_OPTION.EXISTING,
      buttonPrefix: 'import',
    });
  });

  it('renders Terms of Use and Privacy Notice footer links pointing to consensys.io', () => {
    const { getByRole } = renderComponent();

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
