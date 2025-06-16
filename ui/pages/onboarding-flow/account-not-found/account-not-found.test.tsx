import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/jest';
import initializedMockState from '../../../../test/data/mock-state.json';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import CreationSuccessful from './account-not-found';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('Account Not Found Seedless Onboarding View', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

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

    expect(getByText('Wallet not found')).toBeInTheDocument();
    // should show the correct button
    const loginButton = getByText('Yes, create a new wallet');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton.nodeName).toBe('BUTTON');
  });

  it('should navigate to the create-password route when the button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />);
    const loginButton = getByText('Yes, create a new wallet');
    fireEvent.click(loginButton);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
    );
  });
});
