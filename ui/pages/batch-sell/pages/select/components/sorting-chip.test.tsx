import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortingChip } from './sorting-chip';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('SortingChip', () => {
  it('renders the chip with the correct test id', () => {
    render(<SortingChip order="asc" onClick={jest.fn()} />);

    expect(
      screen.getByTestId('batch-sell-select-sorting-chip'),
    ).toBeInTheDocument();
  });

  it('renders the balance label', () => {
    render(<SortingChip order="asc" onClick={jest.fn()} />);

    expect(screen.getByText('balance')).toBeInTheDocument();
  });

  describe('onClick toggle', () => {
    it('calls onClick with "desc" when current order is "asc"', () => {
      const onClick = jest.fn();

      render(<SortingChip order="asc" onClick={onClick} />);

      fireEvent.click(screen.getByTestId('batch-sell-select-sorting-chip'));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith('desc');
    });

    it('calls onClick with "asc" when current order is "desc"', () => {
      const onClick = jest.fn();

      render(<SortingChip order="desc" onClick={onClick} />);

      fireEvent.click(screen.getByTestId('batch-sell-select-sorting-chip'));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith('asc');
    });
  });
});
