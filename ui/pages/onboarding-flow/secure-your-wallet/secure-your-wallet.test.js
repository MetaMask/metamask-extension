import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import reactRouterDom from 'react-router-dom';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import * as Actions from '../../../store/actions';
import SecureYourWallet from './secure-your-wallet';

describe('Secure Your Wallet Onboarding View', () => {
  const useHistoryOriginal = reactRouterDom.useHistory;
  const pushMock = jest.fn();
  beforeAll(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock });
  });

  afterAll(() => {
    reactRouterDom.useHistory = useHistoryOriginal;
  });

  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
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
    expect(pushMock).toHaveBeenCalledTimes(0);
    const checkbox = getByTestId('skip-srp-backup-popover-checkbox');
    fireEvent.click(checkbox);
    const confirmSkip = getByTestId('skip-srp-backup');
    await fireEvent.click(confirmSkip);
    expect(setSeedPhraseBackedUpSpy).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
  });
});
