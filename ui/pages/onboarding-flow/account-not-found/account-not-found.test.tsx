import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/jest';
import initializedMockState from '../../../../test/data/mock-state.json';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import * as Actions from '../../../store/actions';
import AccountNotFound from './account-not-found';

const mockHistoryReplace = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: mockHistoryReplace,
  }),
}));

describe('Account Not Found Seedless Onboarding View', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const mockState = {
    ...initializedMockState,
    metamask: {
      ...initializedMockState.metamask,
      firstTimeFlowType: FirstTimeFlowType.socialImport,
    },
  };
  const customMockStore = configureMockStore([thunk])(mockState);

  it('should display the correct content', () => {
    const { getByText } = renderWithProvider(
      <AccountNotFound />,
      customMockStore,
    );

    expect(getByText('Wallet not found')).toBeInTheDocument();
    // should show the correct button
    const loginButton = getByText('Yes, create a new wallet');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton.nodeName).toBe('BUTTON');
  });

  it('should navigate to the create-password route when the button is clicked', async () => {
    const setFirstTimeFlowTypeSpy = jest
      .spyOn(Actions, 'setFirstTimeFlowType')
      .mockReturnValue(jest.fn().mockResolvedValueOnce(null));

    const { getByText } = renderWithProvider(
      <AccountNotFound />,
      customMockStore,
    );

    const loginButton = getByText('Yes, create a new wallet');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(setFirstTimeFlowTypeSpy).toHaveBeenCalledWith(
        FirstTimeFlowType.socialCreate,
      );
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );
    });
  });

  it('should navigate to the welcome page when the firstTimeFlowType is not socialImport', () => {
    const store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.socialCreate,
      },
    });

    renderWithProvider(<AccountNotFound />, store);

    expect(mockHistoryReplace).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE);
  });

  it('should reset login state and navigate to the welcome page when the button is clicked', async () => {
    const resetOAuthLoginStateSpy = jest
      .spyOn(Actions, 'resetOAuthLoginState')
      .mockReturnValue(jest.fn().mockResolvedValueOnce(null));
    const setFirstTimeFlowTypeSpy = jest
      .spyOn(Actions, 'setFirstTimeFlowType')
      .mockReturnValue(jest.fn().mockResolvedValueOnce(null));

    const { getByTestId } = renderWithProvider(
      <AccountNotFound />,
      customMockStore,
    );
    const loginButton = getByTestId(
      'account-exist-login-with-different-method',
    );
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE);
      expect(resetOAuthLoginStateSpy).toHaveBeenCalled();
      expect(setFirstTimeFlowTypeSpy).toHaveBeenCalledWith(null);
    });
  });
});
