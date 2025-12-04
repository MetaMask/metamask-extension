import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Location as RouterLocation } from 'react-router-dom-v5-compat';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import OnboardingAppHeader from './onboarding-app-header';

const mockUpdateCurrentLocale = jest.fn();

jest.mock('../../../../app/_locales/index.json', () => {
  return [{ code: 'en', name: 'English' }];
});

jest.mock('../../../store/actions.ts', () => ({
  updateCurrentLocale: () => mockUpdateCurrentLocale,
}));

const mockLocation = {
  pathname: '/test',
  search: '',
  hash: '',
  state: null,
} as RouterLocation;

describe('OnboardingAppHeader', () => {
  const mockState = {
    localeMessages: {
      currentLocale: 'en',
    },
  };

  const store = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <OnboardingAppHeader isWelcomePage={false} location={mockLocation} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call updateCurrentLocale action', () => {
    const { getByRole } = renderWithProvider(
      <OnboardingAppHeader isWelcomePage={false} location={mockLocation} />,
      store,
    );

    const selectCombobox = getByRole('combobox');
    fireEvent.change(selectCombobox);

    expect(mockUpdateCurrentLocale).toHaveBeenCalled();
  });

  it('shoul match snapshot on onboarding completion page', () => {
    const completionLocation = {
      ...mockLocation,
      pathname: ONBOARDING_COMPLETION_ROUTE,
    };
    const { container } = renderWithProvider(
      <OnboardingAppHeader
        isWelcomePage={false}
        location={completionLocation}
      />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the pin extension banner tip on onboarding completion page', () => {
    const completionLocation = {
      ...mockLocation,
      pathname: ONBOARDING_COMPLETION_ROUTE,
    };
    const { getByText } = renderWithProvider(
      <OnboardingAppHeader
        isWelcomePage={false}
        location={completionLocation}
      />,
      store,
    );
    expect(getByText('Pin the MetaMask extension')).toBeInTheDocument();
  });
});
