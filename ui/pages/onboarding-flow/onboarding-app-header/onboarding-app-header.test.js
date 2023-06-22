import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import OnboardingAppHeader from './onboarding-app-header';

const mockUpdateCurrentLocale = jest.fn();

jest.mock('../../../../app/_locales/index.json', () => {
  return [{ code: 'en', name: 'English' }];
});

jest.mock('../../../store/actions.ts', () => ({
  updateCurrentLocale: () => mockUpdateCurrentLocale,
}));

describe('OnboardingAppHeader', () => {
  const mockState = {
    localeMessages: {
      currentLocale: 'en',
    },
  };

  const store = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<OnboardingAppHeader />, store);

    expect(container).toMatchSnapshot();
  });

  it('should call updateCurrentLocale action', () => {
    const { getByRole } = renderWithProvider(<OnboardingAppHeader />, store);

    const selectCombobox = getByRole('combobox');
    fireEvent.change(selectCombobox);

    expect(mockUpdateCurrentLocale).toHaveBeenCalled();
  });
});
