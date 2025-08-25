import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { SmartAccountUpdateSuccess } from './smart-account-update-success';

const mockReplace = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: mockReplace,
  }),
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

  it('call history.replace when close button is clicked', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByRole } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSuccess />,
      mockStore,
    );

    fireEvent.click(getByRole('button'));
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
