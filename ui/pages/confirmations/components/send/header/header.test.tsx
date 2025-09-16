import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { createMemoryHistory } from 'history';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProviderAndHistory } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import { Header } from './header';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest
    .fn()
    .mockReturnValue([
      { get: () => null, toString: () => 'searchParams=dummy' },
    ]),
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history: any = createMemoryHistory();

  history.goBack = jest.fn();
  const mockHistoryBack = jest.spyOn(history, 'goBack');

  return {
    ...renderWithProviderAndHistory(<Header />, store, history),
    mockHistoryBack,
  };
};

describe('Header', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('Send')).toBeInTheDocument();
  });

  it('go to previous page when previous button is clicked', () => {
    const { getByRole, mockHistoryBack } = render();

    fireEvent.click(getByRole('button'));
    expect(mockHistoryBack).toHaveBeenCalled();
  });
});
