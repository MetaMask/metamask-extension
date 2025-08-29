import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  MOCK_NFT1155,
  MOCK_NFT721,
  SOLANA_ASSET,
} from '../../../../../../test/data/send/assets';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as AmountSelectionMetrics from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import * as BalanceFunctions from '../../../hooks/send/useBalance';
import * as CurrencyConversions from '../../../hooks/send/useCurrencyConversions';
import * as MaxAmount from '../../../hooks/send/useMaxAmount';
import * as SendType from '../../../hooks/send/useSendType';
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

  it('capture metrics when when fiatmode is toggled', () => {
    const mockSetAmountInputTypeFiat = jest.fn();
    const mockSetAmountInputTypeToken = jest.fn();
    jest
      .spyOn(AmountSelectionMetrics, 'useAmountSelectionMetrics')
      .mockReturnValue({
        setAmountInputTypeFiat: mockSetAmountInputTypeFiat,
        setAmountInputTypeToken: mockSetAmountInputTypeToken,
      } as unknown as ReturnType<
        typeof AmountSelectionMetrics.useAmountSelectionMetrics
      >);

    const { getByText } = render();

    fireEvent.click(getByText('Fiat Mode'));
    expect(mockSetAmountInputTypeFiat).toHaveBeenCalled();
    fireEvent.click(getByText('Native Mode'));
    expect(mockSetAmountInputTypeToken).toHaveBeenCalled();
  });

  it('if fiatmode is enbled call update value with converted values method when value is changed', () => {
    const mockUpdateValue = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateValue: mockUpdateValue,
    } as unknown as SendContext.SendContextType);
    jest.spyOn(CurrencyConversions, 'useCurrencyConversions').mockReturnValue({
      fiatCurrencySymbol: 'USD',
      getFiatValue: () => '20',
      getFiatDisplayValue: () => '$ 20.00',
      getNativeValue: () => '20',
      getNativeDisplayValue: () => 'ETH 1.20001',
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

  it('update value with maxValue when max button is clicked', () => {
    const mockUpdateValue = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateValue: mockUpdateValue,
    } as unknown as SendContext.SendContextType);
    jest.spyOn(MaxAmount, 'useMaxAmount').mockReturnValue({
      getMaxAmount: () => '5',
    });

    const { getByRole, getByText } = render();

    fireEvent.click(getByText('Max'));
    expect(getByRole('textbox')).toHaveValue('5');
    expect(mockUpdateValue).toHaveBeenCalledWith('5');
  });

  it('capture metrics when max button is clicked', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateValue: jest.fn(),
    } as unknown as SendContext.SendContextType);
    jest.spyOn(MaxAmount, 'useMaxAmount').mockReturnValue({
      getMaxAmount: () => '5',
    });
    const mockSetAmountInputMethodPressedMax = jest.fn();
    jest
      .spyOn(AmountSelectionMetrics, 'useAmountSelectionMetrics')
      .mockReturnValue({
        setAmountInputMethodPressedMax: mockSetAmountInputMethodPressedMax,
      } as unknown as ReturnType<
        typeof AmountSelectionMetrics.useAmountSelectionMetrics
      >);

    const { getByText } = render();
    fireEvent.click(getByText('Max'));
    expect(mockSetAmountInputMethodPressedMax).toHaveBeenCalled();
  });

  it('capture metrics when amount is changed', () => {
    const mockSetAmountInputMethodManual = jest.fn();
    jest
      .spyOn(AmountSelectionMetrics, 'useAmountSelectionMetrics')
      .mockReturnValue({
        setAmountInputMethodManual: mockSetAmountInputMethodManual,
      } as unknown as ReturnType<
        typeof AmountSelectionMetrics.useAmountSelectionMetrics
      >);

    const { getByRole } = render();

    fireEvent.change(getByRole('textbox'), { target: { value: 100 } });
    expect(mockSetAmountInputMethodManual).toHaveBeenCalled();
  });

  it('return null for ERC721 asset', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_NFT721,
    } as unknown as SendContext.SendContextType);
    jest.spyOn(BalanceFunctions, 'useBalance').mockReturnValue({
      balance: '1',
    });
    jest.spyOn(CurrencyConversions, 'useCurrencyConversions').mockReturnValue({
      fiatCurrencySymbol: 'USD',
      getFiatValue: () => '20',
      getFiatDisplayValue: () => '$ 20.00',
      getNativeValue: () => '20',
      getNativeDisplayValue: () => 'ETH 1.20001',
    });

    const { container } = render();
    expect(container).toBeEmptyDOMElement();
  });

  it('max and fait mode button is not rendered for asset of type ERC1155', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_NFT1155,
    } as unknown as SendContext.SendContextType);
    jest.spyOn(BalanceFunctions, 'useBalance').mockReturnValue({
      balance: '1',
    });
    jest.spyOn(CurrencyConversions, 'useCurrencyConversions').mockReturnValue({
      fiatCurrencySymbol: 'USD',
      getFiatValue: () => '20',
      getFiatDisplayValue: () => '$ 20.00',
      getNativeValue: () => '20',
      getNativeDisplayValue: () => 'ETH 1.20001',
    });

    const { queryByText } = render();
    expect(queryByText('Fiat Mode')).not.toBeInTheDocument();
    expect(queryByText('Max')).not.toBeInTheDocument();
  });

  it('max button is not rendered for solana native asset', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...SOLANA_ASSET, isNative: true },
    } as unknown as SendContext.SendContextType);
    jest.spyOn(SendType, 'useSendType').mockReturnValue({
      isNonEvmNativeSendType: true,
    } as ReturnType<typeof SendType.useSendType>);
    jest.spyOn(BalanceFunctions, 'useBalance').mockReturnValue({
      balance: '1',
    });
    jest.spyOn(CurrencyConversions, 'useCurrencyConversions').mockReturnValue({
      fiatCurrencySymbol: 'USD',
      getFiatValue: () => '20',
      getFiatDisplayValue: () => '$ 20.00',
      getNativeValue: () => '20',
      getNativeDisplayValue: () => 'ETH 1.20001',
    });

    const { queryByText } = render();
    expect(queryByText('Max')).not.toBeInTheDocument();
  });
});
