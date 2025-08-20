import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/dom';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import * as Actions from '../../../store/actions';
import Welcome from './welcome';
import { WelcomePageState } from './types';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Welcome Page', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      metaMetricsId: '0x00000000',
    },
  };
  const mockStore = configureMockStore()(mockState);

  it('should render', () => {
    const { getByText } = renderWithProvider(
      <Welcome pageState={WelcomePageState.Banner} setPageState={jest.fn()} />,
      mockStore,
    );

    expect(getByText('Welcome to MetaMask')).toBeInTheDocument();

    expect(getByText('Get started')).toBeInTheDocument();
  });

  it('should show the terms of use popup when the user clicks the "Get started" button', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <Welcome pageState={WelcomePageState.Banner} setPageState={jest.fn()} />,
      mockStore,
    );

    const getStartedButton = getByText('Get started');
    fireEvent.click(getStartedButton);

    expect(getByText('Review our Terms of Use')).toBeInTheDocument();

    const agreeButton = getByTestId('terms-of-use-agree-button');
    expect(agreeButton).toBeInTheDocument();
    expect(agreeButton).toBeDisabled();
  });

  it('should show the error modal when the error thrown in login', async () => {
    jest
      .spyOn(Actions, 'startOAuthLogin')
      .mockRejectedValue(new Error('login error'));

    const { getByText, getByTestId } = renderWithProvider(
      <Welcome pageState={WelcomePageState.Login} setPageState={jest.fn()} />,
      mockStore,
    );

    const createButton = getByText('Create a new wallet');
    fireEvent.click(createButton);

    const createWithGoogleButton = getByTestId(
      'onboarding-create-with-google-button',
    );
    fireEvent.click(createWithGoogleButton);

    await waitFor(() => {
      expect(getByTestId('login-error-modal')).toBeInTheDocument();
    });
  });
});
