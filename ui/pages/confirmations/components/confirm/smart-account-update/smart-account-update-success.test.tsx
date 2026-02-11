import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { SmartAccountUpdateSuccess } from './smart-account-update-success';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('SmartAccountUpdateSuccess', () => {
  it('renders correctly', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSuccess />,
      mockStore,
    );

    expect(getByText(messages.smartAccountUpdateSuccessTitle.message)).toBeInTheDocument();
    expect(
      getByText(
        messages.smartAccountUpdateSuccessMessage.message,
      ),
    ).toBeInTheDocument();
  });

  it('call navigate when close button is clicked', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByRole } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSuccess />,
      mockStore,
    );

    fireEvent.click(getByRole('button'));
    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
