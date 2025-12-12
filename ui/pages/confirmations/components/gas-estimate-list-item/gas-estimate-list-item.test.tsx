import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { GasOption } from '../../types/gas';
import {
  GasEstimateListHeader,
  GasEstimateListItem,
} from './gas-estimate-list-item';

const mockOption: GasOption = {
  emoji: '🚀',
  estimatedTime: '15 sec',
  isSelected: false,
  key: 'fast',
  name: 'Fast',
  onSelect: jest.fn(),
  value: '0.0001 ETH',
  valueInFiat: '$0.25',
};

describe('GasEstimateListHeader', () => {
  it('renders header with gas option and max fee labels', () => {
    const { getByText } = renderWithProvider(<GasEstimateListHeader />);

    expect(getByText('Gas option')).toBeInTheDocument();
    expect(getByText('Max fee')).toBeInTheDocument();
  });
});

describe('GasEstimateListItem', () => {
  it('renders list item with option details', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <GasEstimateListItem option={mockOption} />,
    );

    expect(getByTestId('gas-option-Fast')).toBeInTheDocument();
    expect(getByText('🚀')).toBeInTheDocument();
    expect(getByText('Fast')).toBeInTheDocument();
    expect(getByText('15 sec')).toBeInTheDocument();
    expect(getByText('0.0001 ETH')).toBeInTheDocument();
    expect(getByText('$0.25')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelectMock = jest.fn();
    const option = { ...mockOption, onSelect: onSelectMock };

    const { getByTestId } = renderWithProvider(
      <GasEstimateListItem option={option} />,
    );

    fireEvent.click(getByTestId('gas-option-Fast'));
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when isSelected is true', () => {
    const selectedOption = { ...mockOption, isSelected: true };

    const { getByTestId } = renderWithProvider(
      <GasEstimateListItem option={selectedOption} />,
    );

    const listItem = getByTestId('gas-option-Fast');
    expect(listItem).toHaveClass('gas-fee-token-list-item--selected');
  });

  it('does not render info icon when tooltipProps is not provided', () => {
    const { container } = renderWithProvider(
      <GasEstimateListItem option={mockOption} />,
    );

    const infoIcon = container.querySelector('[data-testid="icon"]');
    expect(infoIcon).not.toBeInTheDocument();
  });

  it('renders info icon when tooltipProps is provided', () => {
    const optionWithTooltip: GasOption = {
      ...mockOption,
      tooltipProps: {
        priorityLevel: 'high',
        maxFeePerGas: '100',
        maxPriorityFeePerGas: '10',
        gasLimit: 21000,
      },
    };

    const { container } = renderWithProvider(
      <GasEstimateListItem option={optionWithTooltip} />,
    );

    const infoIcon = container.querySelector('.mm-icon');
    expect(infoIcon).toBeInTheDocument();
  });
});
