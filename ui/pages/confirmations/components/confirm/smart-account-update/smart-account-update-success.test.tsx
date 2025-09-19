import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { SmartAccountUpdateSuccess } from './smart-account-update-success';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('SmartAccountUpdateSuccess', () => {
  it('renders correctly', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithProvider(
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

  it('call useNavigate when close button is clicked', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByRole } = renderWithProvider(
      <SmartAccountUpdateSuccess />,
      mockStore,
    );

    fireEvent.click(getByRole('button'));
    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
