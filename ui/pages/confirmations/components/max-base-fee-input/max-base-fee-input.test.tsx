import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import configureStore from '../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { MaxBaseFeeInput } from './max-base-fee-input';

jest.mock('../../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: () => ({
    gasFeeEstimates: {},
  }),
}));

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
    <MaxBaseFeeInput
      maxPriorityFeePerGas="0x3b9aca00"
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

describe('MaxBaseFeeInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input with label', () => {
    const { getByTestId, getByText } = render();

    expect(getByTestId('max-base-fee-input')).toBeInTheDocument();
    expect(getByText('Max base fee')).toBeInTheDocument();
  });

  it('renders the GWEI unit', () => {
    const { getByText } = render();

    expect(getByText('GWEI')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const { getByTestId, mockOnChange } = render();

    const input = getByTestId('max-base-fee-input').querySelector(
      'input',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onErrorChange with error for invalid input', () => {
    const { getByTestId, mockOnErrorChange } = render();

    const input = getByTestId('max-base-fee-input').querySelector(
      'input',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnErrorChange).toHaveBeenCalled();
  });

  it('does not call onChange when input is invalid', () => {
    const { getByTestId, mockOnChange } = render();

    const input = getByTestId('max-base-fee-input').querySelector(
      'input',
    ) as HTMLInputElement;
    mockOnChange.mockClear();
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
