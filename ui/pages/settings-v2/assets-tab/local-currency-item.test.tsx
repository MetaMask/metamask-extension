import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { CURRENCY_ROUTE } from '../../../helpers/constants/routes';
import { LocalCurrencyItem } from './local-currency-item';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('LocalCurrencyItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<LocalCurrencyItem />, mockStore);

    expect(
      screen.getByText(messages.localCurrency.message),
    ).toBeInTheDocument();
  });

  it('displays current currency in uppercase', () => {
    renderWithProvider(<LocalCurrencyItem />, mockStore);

    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders navigation button', () => {
    renderWithProvider(<LocalCurrencyItem />, mockStore);

    const button = screen.getByRole('button', {
      name: messages.localCurrency.message,
    });
    expect(button).toBeInTheDocument();
  });

  it('navigates to currency page when clicked', () => {
    renderWithProvider(<LocalCurrencyItem />, mockStore);

    const button = screen.getByRole('button', {
      name: messages.localCurrency.message,
    });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(CURRENCY_ROUTE);
  });
});
