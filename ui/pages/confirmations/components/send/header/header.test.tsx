import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as BalanceFunctions from '../../../hooks/send/useBalance';
import * as SendContext from '../../../context/send';
import { Header } from './header';

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
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
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});
