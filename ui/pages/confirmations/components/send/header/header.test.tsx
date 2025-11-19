import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import { Header } from './header';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest
    .fn()
    .mockReturnValue([
      { get: () => null, toString: () => 'searchParams=dummy' },
    ]),
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);

  return renderWithProvider(<Header />, store);
};

describe('Header', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('Send')).toBeInTheDocument();
  });

  it('go to previous page when previous button is clicked', () => {
    const { getByRole } = render();

    fireEvent.click(getByRole('button'));
    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });
});
