import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import configureStore from '../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { GasInput } from './gas-input';

const render = (props = {}) => {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
  });

  const store = configureStore(
    getMockConfirmStateForTransaction(contractInteraction),
  );

  const mockOnChange = jest.fn();
  const mockOnErrorChange = jest.fn();

  const result = renderWithConfirmContextProvider(
    <GasInput
      onChange={mockOnChange}
      onErrorChange={mockOnErrorChange}
      {...props}
    />,
    store,
  );

  return {
    ...result,
    mockOnChange,
    mockOnErrorChange,
  };
};

describe('GasInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input with label', () => {
    const { getByTestId, getByText } = render();

    expect(getByTestId('gas-input')).toBeInTheDocument();
    expect(getByText('Gas limit')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const { getByTestId, mockOnChange } = render();

    const input = getByTestId('gas-input').querySelector(
      'input',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '21000' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onErrorChange with error for invalid input', () => {
    const { getByTestId, mockOnErrorChange } = render();

    const input = getByTestId('gas-input').querySelector(
      'input',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnErrorChange).toHaveBeenCalled();
  });

  it('does not call onChange when input is invalid', () => {
    const { getByTestId, mockOnChange } = render();

    const input = getByTestId('gas-input').querySelector(
      'input',
    ) as HTMLInputElement;
    mockOnChange.mockClear();
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
