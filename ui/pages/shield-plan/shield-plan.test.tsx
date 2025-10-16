import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import ShieldPlan from './shield-plan';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('Change payment method', () => {
  it('should show shield plan page', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByTestId } = renderWithProvider(<ShieldPlan />, mockStore);

    expect(getByTestId('shield-plan-page')).toBeInTheDocument();
  });
});
