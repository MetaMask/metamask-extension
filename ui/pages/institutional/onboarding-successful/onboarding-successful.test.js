import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import { setBackgroundConnection } from '../../../store/background-connection';
import OnboardingSuccessful from './onboarding-successful';

const mockHistoryPush = jest.fn();

const completeOnboardingStub = jest
  .fn()
  .mockImplementation(() => Promise.resolve());

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('Successful Onboarding View', () => {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  setBackgroundConnection({ completeOnboarding: completeOnboardingStub });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render the onboarding-successful view', () => {
    const { getByTestId } = renderWithProvider(<OnboardingSuccessful />, store);
    const continueButton = getByTestId('onboarding-continue-button');
    expect(getByTestId('onboarding-successful')).toBeInTheDocument();
    expect(continueButton).toBeInTheDocument();
  });
});
