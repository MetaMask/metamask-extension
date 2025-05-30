import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import * as Actions from '../../../store/actions';
import SecureYourWallet from './secure-your-wallet';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('Secure Your Wallet Onboarding View', () => {
  const mockStore = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: {
              keyring: 'HD Key Tree',
            },
          },
        },
        selectedAccount: 'accountId',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
    },
    localeMessages: {
      currentLocale: 'en',
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  it('should show a popover asking the user if they want to skip account security if they click "Remind me later"', () => {
    const { queryAllByText, getByText } = renderWithProvider(
      <SecureYourWallet />,
      store,
    );
    const remindMeLaterButton = getByText('Remind me later (not recommended)');
    expect(queryAllByText('Skip account security?')).toHaveLength(0);
    fireEvent.click(remindMeLaterButton);
    expect(queryAllByText('Skip account security?')).toHaveLength(1);
  });

  it('should not be able to click "skip" until "Skip Account Security" terms are agreed to', async () => {
    const setSeedPhraseBackedUpSpy = jest
      .spyOn(Actions, 'setSeedPhraseBackedUp')
      .mockReturnValue({ type: 'setSeedPhraseBackedUp' });

    const { getByText, getByTestId } = renderWithProvider(
      <SecureYourWallet />,
      store,
    );
    const remindMeLaterButton = getByText('Remind me later (not recommended)');
    fireEvent.click(remindMeLaterButton);
    const skipButton = getByText('Skip');
    fireEvent.click(skipButton);
    expect(mockUseNavigate).toHaveBeenCalledTimes(0);
    const checkbox = getByTestId('skip-srp-backup-popover-checkbox');
    fireEvent.click(checkbox);
    const confirmSkip = getByTestId('skip-srp-backup');
    await fireEvent.click(confirmSkip);
    expect(setSeedPhraseBackedUpSpy).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
  });
});
