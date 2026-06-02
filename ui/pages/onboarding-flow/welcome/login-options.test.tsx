import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { ThemeType } from '../../../../shared/constants/preferences';
import LoginOptions from './login-options';
import { LOGIN_OPTION } from './types';

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
