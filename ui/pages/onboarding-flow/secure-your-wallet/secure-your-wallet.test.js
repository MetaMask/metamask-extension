import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import * as Actions from '../../../store/actions';
import * as BrowserRuntimeUtils from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import SecureYourWallet from './secure-your-wallet';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: '' }),
  };
});

describe('Secure Your Wallet Onboarding View', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
    const remindMeLaterButton = getByText('Remind me later');
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
    const remindMeLaterButton = getByText('Remind me later');
    fireEvent.click(remindMeLaterButton);
    const skipButton = getByText('Skip');
    fireEvent.click(skipButton);
    expect(mockNavigate).toHaveBeenCalledTimes(0);
    const checkbox = getByTestId('skip-srp-backup-checkbox');
    fireEvent.click(checkbox);
    const confirmSkip = getByTestId('skip-srp-backup-button');
    fireEvent.click(confirmSkip);

    await waitFor(() => {
      expect(setSeedPhraseBackedUpSpy).toHaveBeenCalledWith(false);
      expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS);
    });
  });

  it('should go to Onboarding Completion page as a next step in firefox', async () => {
    const setSeedPhraseBackedUpSpy = jest
      .spyOn(Actions, 'setSeedPhraseBackedUp')
      .mockReturnValue({ type: 'setSeedPhraseBackedUp' });

    jest
      .spyOn(BrowserRuntimeUtils, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const { getByText, getByTestId } = renderWithProvider(
      <SecureYourWallet />,
      store,
    );

    const remindMeLaterButton = getByText('Remind me later');
    fireEvent.click(remindMeLaterButton);
    const skipButton = getByText('Skip');
    fireEvent.click(skipButton);

    const checkbox = getByTestId('skip-srp-backup-checkbox');
    fireEvent.click(checkbox);
    const confirmSkip = getByTestId('skip-srp-backup-button');
    fireEvent.click(confirmSkip);

    await waitFor(() => {
      expect(setSeedPhraseBackedUpSpy).toHaveBeenCalledWith(false);
      expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
    });
  });
});
