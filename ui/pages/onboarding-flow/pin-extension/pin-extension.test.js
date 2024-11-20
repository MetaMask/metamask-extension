import React from 'react';
import { fireEvent } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import {
  setCompletedOnboarding,
  toggleExternalServices,
} from '../../../store/actions';
import PinExtension from './pin-extension';

jest.mock('../../../store/actions', () => ({
  toggleExternalServices: jest.fn(),
  setCompletedOnboarding: jest.fn(),
  performSignIn: jest.fn(),
}));

const mockPromises = [];

const mockDispatch = jest.fn().mockImplementation(() => {
  const promise = Promise.resolve();
  mockPromises.push(promise);
  return promise;
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

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

  const pushMock = jest.fn();
  beforeAll(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock });
  });

  it('should call completeOnboarding in the background when Done" button is clicked', async () => {
    const { getByText } = renderWithProvider(<PinExtension />, store);
    const nextButton = getByText('Next');
    fireEvent.click(nextButton);
    const gotItButton = getByText('Done');
    fireEvent.click(gotItButton);
    await Promise.all(mockPromises);
    expect(toggleExternalServices).toHaveBeenCalledTimes(1);
    expect(setCompletedOnboarding).toHaveBeenCalledTimes(1);
  });
});
