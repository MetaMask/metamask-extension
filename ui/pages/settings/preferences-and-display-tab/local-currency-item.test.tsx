import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { CURRENCY_ROUTE } from '../../../helpers/constants/routes';
import { LocalCurrencyItem } from './local-currency-item';

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

  it('renders navigation link', () => {
    renderWithProvider(<LocalCurrencyItem />, mockStore);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  it('links to currency page', () => {
    renderWithProvider(<LocalCurrencyItem />, mockStore);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', CURRENCY_ROUTE);
  });
});
