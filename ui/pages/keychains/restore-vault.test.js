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

    const { getByText, getByRole, getAllByRole } = renderWithProvider(
      <RestoreVaultPage {...props} />,
      configureMockStore()({
        metamask: { currentLocale: 'en' },
        appState: { isLoading: false },
      }),
    );

    expect(getByText('Reset wallet')).toBeInTheDocument();
    expect(
      getByText(
        'MetaMask does not keep a copy of your password. If you’re having trouble unlocking your account, you will need to reset your wallet. You can do this by providing the Secret Recovery Phrase you used when you set up your wallet.',
      ),
    ).toBeInTheDocument();
    expect(
      getByText(
        'This action will delete your current wallet and Secret Recovery Phrase from this device, along with the list of accounts you’ve curated. After resetting with a Secret Recovery Phrase, you’ll see a list of accounts based on the Secret Recovery Phrase you use to reset. This new list will automatically include accounts that have a balance. You’ll also be able to created previously. Custom accounts that you’ve imported will need to be , and any custom tokens you’ve added to an account will need to be as well.',
      ),
    ).toBeInTheDocument();
    expect(
      getByRole('link', { name: 're-add any other accounts' }),
    ).toBeInTheDocument();
    expect(getAllByRole('link', { name: 're-added' })).toHaveLength(2);
    expect(
      getByText(
        'Make sure you’re using the correct Secret Recovery Phrase before proceeding. You will not be able to undo this.',
      ),
    ).toBeInTheDocument();
  });
});
