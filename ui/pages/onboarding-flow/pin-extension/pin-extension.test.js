import React from 'react';
import { fireEvent } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/jest';
import PinExtension from './pin-extension';

const completeOnboardingStub = jest
  .fn()
  .mockImplementation(() => Promise.resolve());

const toggleExternalServicesStub = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

describe('Creation Successful Onboarding View', () => {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
    },
    appState: {
      externalServicesOnboardingToggleState: true,
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  setBackgroundConnection({
    completeOnboarding: completeOnboardingStub,
    toggleExternalServices: toggleExternalServicesStub,
  });

  const pushMock = jest.fn();
  beforeAll(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock });
  });

  it('should call completeOnboarding in the background when Done" button is clicked', () => {
    const { getByText } = renderWithProvider(<PinExtension />, store);
    const nextButton = getByText('Next');
    fireEvent.click(nextButton);
    const gotItButton = getByText('Done');
    fireEvent.click(gotItButton);
    expect(completeOnboardingStub).toHaveBeenCalledTimes(1);
  });
});
