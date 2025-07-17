import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import OnboardingError from './onboarding-error';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

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
    appState: {
      onboardingErrorReport: {
        error: new Error('Test error'),
        view: 'Test',
      },
    },
  };
  const customMockStore = configureMockStore([thunk])(mockState);

  it('should redirect to the welcome page if no error report is provided', () => {
    const { history } = renderWithProvider(<OnboardingError />);

    expect(history.location.pathname).toStrictEqual(
      `${ONBOARDING_WELCOME_ROUTE}/`,
    );
  });

  it('should display the error report if it is provided', () => {
    const { getByText } = renderWithProvider(
      <OnboardingError />,
      customMockStore,
    );

    expect(getByText('Test')).toBeInTheDocument();
  });
});
