import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import RestoreVaultPage from './restore-vault';

describe('Restore vault Component', () => {
  it('clicks imports seed button', () => {
    const props = {
      history: {
        push: sinon.spy(),
      },
    };

    const { getByText, getByRole } = renderWithProvider(
      <RestoreVaultPage {...props} />,
      configureMockStore()({
        metamask: { currentLocale: 'en' },
        appState: { isLoading: false },
      }),
    );

    expect(getByText('Forgot password?')).toBeInTheDocument();
    expect(
      getByText('MetaMask cannot recover your password.'),
    ).toBeInTheDocument();
    expect(
      getByText(
        'To recover access to your wallet you will have to restore it using the Secret Recovery Phrase. This action will overwrite existing wallet data and cannot be undone. Make sure you’re using the correct Secret Recovery Phrase.',
      ),
    ).toBeInTheDocument();
    expect(
      getByText(
        "If you restore a wallet using the Secret Recovery Phrase, only the wallet’s initial account might appear at first. You'll be able to created previously.",
      ),
    ).toBeInTheDocument();
    expect(
      getByRole('link', { name: 're-add any other accounts' }),
    ).toBeInTheDocument();
    expect(
      getByText(
        'Additionally, any imported external account, or custom tokens that were added, will not appear. You will need to using their Private Key(s), and that are missing.',
      ),
    ).toBeInTheDocument();
    expect(
      getByRole('link', { name: 're-import any such accounts' }),
    ).toBeInTheDocument();
    expect(
      getByRole('link', { name: 're-add any tokens' }),
    ).toBeInTheDocument();
  });
});
