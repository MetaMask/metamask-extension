import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { ASSETS_ROUTE } from '../../../helpers/constants/routes';
import CurrencySubPage from './currency-sub-page';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSetCurrentCurrency = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setCurrentCurrency: (val: string) => {
    mockSetCurrentCurrency(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('CurrencySubPage', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders currency options', () => {
    renderWithProvider(<CurrencySubPage />, mockStore);

    expect(screen.getByText('AUD - Australian Dollar')).toBeInTheDocument();
    expect(screen.getByText('EUR - Euro')).toBeInTheDocument();
    expect(screen.getByText('INR - Indian Rupee')).toBeInTheDocument();
  });

  it('calls setCurrentCurrency and navigates when a currency is clicked', () => {
    renderWithProvider(<CurrencySubPage />, mockStore);

    const audOption = screen.getByText('AUD - Australian Dollar');
    fireEvent.click(audOption);

    expect(mockSetCurrentCurrency).toHaveBeenCalledWith('aud');
    expect(mockNavigate).toHaveBeenCalledWith(ASSETS_ROUTE);
  });

  it('selects a different currency when clicked', () => {
    const storeWithUsd = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        currentCurrency: 'usd',
      },
    });
    renderWithProvider(<CurrencySubPage />, storeWithUsd);

    const option = screen.getByText('INR - Indian Rupee');
    fireEvent.click(option);

    expect(mockSetCurrentCurrency).toHaveBeenCalledWith('inr');
    expect(mockNavigate).toHaveBeenCalledWith(ASSETS_ROUTE);
  });
});
