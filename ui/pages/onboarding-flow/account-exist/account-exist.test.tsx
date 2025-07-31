import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import initializedMockState from '../../../../test/data/mock-state.json';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import * as Actions from '../../../store/actions';
import AccountExist from './account-exist';

const mockHistoryReplace = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: mockHistoryReplace,
  }),
}));

describe('Account Exist Seedless Onboarding View', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const mockState = {
    ...initializedMockState,
    metamask: {
      ...initializedMockState.metamask,
      firstTimeFlowType: FirstTimeFlowType.socialCreate,
    },
  };
  const customMockStore = configureMockStore([thunk])(mockState);

  it('should display the correct content', () => {
    const { getByText } = renderWithProvider(<AccountExist />, customMockStore);

    expect(getByText('Wallet already exists')).toBeInTheDocument();
    // should show the correct button
    const loginButton = getByText('Log in');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton.nodeName).toBe('BUTTON');
  });

  it('should navigate to the unlock page when the button is clicked', async () => {
    const setFirstTimeFlowTypeSpy = jest
      .spyOn(Actions, 'setFirstTimeFlowType')
      .mockReturnValue(jest.fn().mockResolvedValueOnce(null));

    const { getByText } = renderWithProvider(<AccountExist />, customMockStore);
    const loginButton = getByText('Log in');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(ONBOARDING_UNLOCK_ROUTE);
      expect(setFirstTimeFlowTypeSpy).toHaveBeenCalledWith(
        FirstTimeFlowType.socialImport,
      );
    });
  });

  it('should navigate to the welcome page when the firstTimeFlowType is not socialCreate', () => {
    const store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.socialImport,
      },
    });

    renderWithProvider(<AccountExist />, store);

    expect(mockHistoryReplace).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE);
  });

  it('should reset login state and navigate to the welcome page when the button is clicked', async () => {
    const resetOnboardingSpy = jest
      .spyOn(Actions, 'resetOnboarding')
      .mockReturnValue(jest.fn().mockResolvedValueOnce(null));

    const { getByTestId } = renderWithProvider(
      <AccountExist />,
      customMockStore,
    );
    const loginButton = getByTestId(
      'account-exist-login-with-different-method',
    );
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE);
      expect(resetOnboardingSpy).toHaveBeenCalled();
    });
  });
});
