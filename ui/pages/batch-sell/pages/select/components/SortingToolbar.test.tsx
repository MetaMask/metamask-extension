import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortingToolbar } from './SortingToolbar';

jest.mock('./SortingChip', () => ({
  SortingChip: ({
    order,
    onClick,
  }: {
    order: 'asc' | 'desc';
    onClick: (newOrder: 'asc' | 'desc') => void;
  }) => (
    <button
      data-testid="sorting-chip"
      data-order={order}
      onClick={() => onClick(order === 'asc' ? 'desc' : 'asc')}
    >
      {order}
    </button>
  ),
}));

describe('SortingToolbar', () => {
  it('renders the container with the correct test id', () => {
    render(<SortingToolbar balance={{ order: 'asc', onClick: jest.fn() }} />);

    expect(
      screen.getByTestId('batch-sell-select-sorting-toolbar'),
    ).toBeInTheDocument();
  });

  it('renders a SortingChip', () => {
    render(<SortingToolbar balance={{ order: 'desc', onClick: jest.fn() }} />);

    expect(screen.getByTestId('sorting-chip')).toBeInTheDocument();
  });

  it('passes the balance order to SortingChip', () => {
    render(<SortingToolbar balance={{ order: 'desc', onClick: jest.fn() }} />);

    expect(screen.getByTestId('sorting-chip')).toHaveAttribute(
      'data-order',
      'desc',
    );
  });

  it('forwards the onClick handler from the balance prop', () => {
    const onClick = jest.fn();

    render(<SortingToolbar balance={{ order: 'asc', onClick }} />);

    fireEvent.click(screen.getByTestId('sorting-chip'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('desc');
  });
});
