import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { VirtualizedList } from './virtualized-list';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(() => ({
    getTotalSize: () => 200,
    getVirtualItems: () => [
      { index: 0, start: 0 },
      { index: 1, start: 50 },
    ],
  })),
}));

describe('VirtualizedList', () => {
  it('renders items using renderItem and keyExtractor', () => {
    const data = ['First', 'Second'];

    render(
      <ScrollContainer>
        <VirtualizedList
          data={data}
          estimatedItemSize={50}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <div>{item}</div>}
        />
      </ScrollContainer>,
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
