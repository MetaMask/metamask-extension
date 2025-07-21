import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import initializedMockState from '../../../../test/data/mock-state.json';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { UNLOCK_ROUTE } from '../../../helpers/constants/routes';
import CreationSuccessful from './account-exist';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('Account Exist Seedless Onboarding View', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should display the correct content', () => {
    const importFirstTimeFlowState = {
      ...initializedMockState,
      metamask: {
        ...initializedMockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.seedless,
      },
    };
    const customMockStore = configureMockStore([thunk])(
      importFirstTimeFlowState,
    );

    const { getByText } = renderWithProvider(
      <CreationSuccessful />,
      customMockStore,
    );

    expect(getByText('Wallet already exists')).toBeInTheDocument();
    // should show the correct button
    const loginButton = getByText('Log in');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton.nodeName).toBe('BUTTON');
  });

  it('should navigate to the unlock page when the button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />);
    const loginButton = getByText('Log in');
    fireEvent.click(loginButton);
    expect(mockHistoryPush).toHaveBeenCalledWith(UNLOCK_ROUTE);
  });
});
