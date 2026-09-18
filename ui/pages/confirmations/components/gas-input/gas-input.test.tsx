import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import configureStore from '../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { GasInput } from './gas-input';

const render = (props: { gasLimit?: Hex } = { gasLimit: '0x5208' }) => {
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
      gasLimit={props.gasLimit}
      onChange={mockOnChange}
      onErrorChange={mockOnErrorChange}
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
    expect(getByText(messages.gasLimit.message)).toBeInTheDocument();
  });

  it('renders an empty value when the gas estimate is missing', () => {
    const { getByTestId } = render({ gasLimit: undefined });

    const input = getByTestId('gas-input').querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.value).toBe('');
  });

  it('updates the displayed value when the gas estimate changes', () => {
    const { getByTestId, mockOnChange, mockOnErrorChange, rerender } = render({
      gasLimit: undefined,
    });
    const renderGasInput = (gasLimit: Hex | undefined) => (
      <GasInput
        gasLimit={gasLimit}
        onChange={mockOnChange}
        onErrorChange={mockOnErrorChange}
      />
    );

    rerender(renderGasInput('0x7530'));

    const input = getByTestId('gas-input').querySelector(
      'input',
    ) as HTMLInputElement;
    expect(input.value).toBe('30000');

    rerender(renderGasInput(undefined));

    expect(input.value).toBe('');
  });

  it('calls onChange when value changes', () => {
    const { getByTestId, mockOnChange } = render();

    const input = getByTestId('gas-input').querySelector(
      'input',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '30000' } });

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
