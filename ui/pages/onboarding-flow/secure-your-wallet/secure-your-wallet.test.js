import React from 'react';
import SecureYourWallet from './secure-your-wallet';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { fireEvent } from '@testing-library/dom';
import configureMockStore from 'redux-mock-store';
import reactRouterDom from 'react-router-dom';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';


describe('Secure Your Wallet Onboarding View', () => {
  const useHistoryOriginal = reactRouterDom.useHistory;
  const pushMock = jest.fn();
  beforeAll(() => {
    reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock });
  });

  afterAll(() => {
    reactRouterDom.useHistory = useHistoryOriginal;
  });

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
  };

  const store = configureMockStore()(mockStore);
  it('Should show a popover asking the user if they want to skip account security if they click "Remind me later"', () => {
    const { queryAllByText, getByText } = renderWithProvider(
      <SecureYourWallet />,
      store,
    );
    const remindMeLaterButton = getByText('Remind me later (not recommended)');
    expect(queryAllByText('Skip Account Security?')).toHaveLength(0);
    fireEvent.click(remindMeLaterButton);
    expect(queryAllByText('Skip Account Security?')).toHaveLength(1);
  });

  it('Should not be able to click "skip" until "Skip Account Security" terms are agreed to', () => {
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
    fireEvent.click(skipButton);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE)
  });
});
