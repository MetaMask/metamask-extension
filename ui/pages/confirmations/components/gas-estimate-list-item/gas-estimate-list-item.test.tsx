import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { GasOption } from '../../types/gas';
import { GasEstimateListItem } from './gas-estimate-list-item';

const mockOption: GasOption = {
  estimatedTime: '15 sec',
  isSelected: false,
  key: 'fast',
  name: 'Fast',
  onSelect: jest.fn(),
  value: '0.0001 ETH',
  valueInFiat: '$0.25',
};

describe('GasEstimateListItem', () => {
  it('renders list item with option details', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <GasEstimateListItem option={mockOption} />,
    );

    expect(getByTestId('gas-option-fast')).toBeInTheDocument();
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

    fireEvent.click(getByTestId('gas-option-fast'));
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when isSelected is true', () => {
    const selectedOption = { ...mockOption, isSelected: true };

    const { getByTestId } = renderWithProvider(
      <GasEstimateListItem option={selectedOption} />,
    );

    const listItem = getByTestId('gas-option-fast');
    expect(listItem).toHaveClass('gas-fee-token-list-item--selected');
  });

  it('does not render info icon when tooltipProps is not provided', () => {
    const { container } = renderWithProvider(
      <GasEstimateListItem option={mockOption} />,
    );

    const infoIcon = container.querySelector('[data-testid="icon"]');
    expect(infoIcon).not.toBeInTheDocument();
  });
});
