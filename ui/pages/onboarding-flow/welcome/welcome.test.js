import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as Actions from '../../../store/actions';
import * as Environment from '../../../../shared/modules/environment';
import Welcome from './welcome';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

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
  const mockStore = configureMockStore([thunk])(mockState);

  it('should render', () => {
    const { getByText } = renderWithProvider(<Welcome />, mockStore);

    expect(getByText(`Let's get started!`)).toBeInTheDocument();

    const createButton = getByText('Create a new wallet');
    expect(createButton).toBeInTheDocument();

    const importButton = getByText('I have an existing wallet');
    expect(importButton).toBeInTheDocument();
  });

  it('should render with seedless onboarding feature disabled', () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(false);

    const { getByText } = renderWithProvider(<Welcome />, mockStore);

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
      .mockImplementation(() => async () => {
        throw new Error('login error');
      });

    const { getByText, getByTestId } = renderWithProvider(
      <Welcome />,
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
