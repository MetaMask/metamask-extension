import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import ShieldPlan from './shield-plan';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

describe('Change payment method', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: '/shield-plan',
      search: '',
    });
  });

  it('should show shield plan page', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByTestId } = renderWithProvider(<ShieldPlan />, mockStore);

    expect(getByTestId('shield-plan-page')).toBeInTheDocument();
  });
});
