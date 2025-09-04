import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { SmartAccountUpdateSuccess } from './smart-account-update-success';

const mockNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}));

describe('SmartAccountUpdateSuccess', () => {
  it('renders correctly', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSuccess />,
      mockStore,
    );

    expect(getByText('Successful!')).toBeInTheDocument();
    expect(
      getByText(
        'Your account will be updated to smart account with your next transaction.',
      ),
    ).toBeInTheDocument();
  });

  it('call navigate with replace when close button is clicked', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByRole } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSuccess />,
      mockStore,
    );

    fireEvent.click(getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
