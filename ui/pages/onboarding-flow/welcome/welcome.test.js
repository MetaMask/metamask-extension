import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/dom';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import * as Actions from '../../../store/actions';
import * as Environment from '../../../../shared/modules/environment';
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

jest.mock('../../../../shared/modules/environment', () => ({
  getIsSeedlessOnboardingFeatureEnabled: jest.fn().mockReturnValue(true),
}));

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
      <Welcome pageState={WelcomePageState.Login} />,
      mockStore,
    );

    expect(getByText(`Let's get started!`)).toBeInTheDocument();

    const createButton = getByText('Create a new wallet');
    expect(createButton).toBeInTheDocument();

    const importButton = getByText('I have an existing wallet');
    expect(importButton).toBeInTheDocument();

    expect(Environment.getIsSeedlessOnboardingFeatureEnabled()).toBe(true);
  });

  it('should render with seedless onboarding feature disabled', () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(false);

    const { getByText } = renderWithProvider(
      <Welcome pageState={WelcomePageState.Login} />,
      mockStore,
    );

    expect(getByText(`Let's get started!`)).toBeInTheDocument();

    expect(Environment.getIsSeedlessOnboardingFeatureEnabled()).toBe(false);

    expect(
      getByText('Import using Secret Recovery Phrase'),
    ).toBeInTheDocument();

    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);
  });

  it('should show the error modal when the error thrown in login', async () => {
    jest
      .spyOn(Actions, 'startOAuthLogin')
      .mockRejectedValue(new Error('login error'));

    const { getByText, getByTestId } = renderWithProvider(
      <Welcome pageState={WelcomePageState.Login} />,
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
