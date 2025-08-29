import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as BalanceFunctions from '../../../hooks/send/useBalance';
import * as CurrencyConversions from '../../../hooks/send/useCurrencyConversions';
import * as SendContext from '../../../context/send';
import { Amount } from './amount';

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

  return renderWithProvider(<Amount />, store);
};

describe('Amount', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('AMOUNT')).toBeInTheDocument();
  });

  it('call update value method when value is changed', () => {
    const mockUpdateValue = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateValue: mockUpdateValue,
    } as unknown as SendContext.SendContextType);

    const { getByRole } = render();

    fireEvent.change(getByRole('textbox'), { target: { value: 1 } });
    expect(mockUpdateValue).toHaveBeenCalledWith('1');
  });

  it('amount input is reset when fiatmode is toggled', () => {
    const { getByRole, getByText } = render();

    fireEvent.change(getByRole('textbox'), { target: { value: 100 } });
    expect(getByText('Fiat Mode')).toBeInTheDocument();
    fireEvent.click(getByText('Fiat Mode'));
    expect(getByText('Native Mode')).toBeInTheDocument();
    expect(getByRole('textbox')).toHaveValue('');
  });

  it('if fiatmode is enbled call update value with converted values method when value is changed', () => {
    const mockUpdateValue = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateValue: mockUpdateValue,
    } as unknown as SendContext.SendContextType);
    jest.spyOn(CurrencyConversions, 'useCurrencyConversions').mockReturnValue({
      fiatCurrencySymbol: 'USD',
      getFiatValue: () => '20',
      getNativeValue: () => '20',
    });

    const { getByRole, getByText } = render();

    fireEvent.click(getByText('Fiat Mode'));
    fireEvent.change(getByRole('textbox'), { target: { value: 1 } });
    expect(mockUpdateValue).toHaveBeenCalledWith('20');
  });

  it('display balance returned by useBalance hook', () => {
    jest.spyOn(BalanceFunctions, 'useBalance').mockReturnValue({
      balance: '10.023',
    });
    const { getByText } = render();

    expect(getByText('Balance: 10.023')).toBeInTheDocument();
  });
});
