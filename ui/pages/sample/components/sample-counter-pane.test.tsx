import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSample } from '../../../ducks/sample/useSample';
import { SampleCounterPane } from './sample-counter-pane';

// Import the mocked module to control its implementation

// Create mock functions
const mockIncrement = jest.fn();
const mockSetCounter = jest.fn();

// Mock the counter module
jest.mock('../../../ducks/sample/useSample', () => ({
  useSample: jest.fn(),
}));

describe('SampleCounterPane', () => {
  // Helper function to setup the mock with different values
  const setupMock = (value = 5, error: Error | null = null) => {
    (useSample as jest.Mock).mockReturnValue({
      value,
      error,
      increment: mockIncrement,
      setCounter: mockSetCounter,
    });
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    setupMock();
  });

  it('renders the counter component with correct value', () => {
    render(<SampleCounterPane />);

    // Check heading
    expect(screen.getByTestId('sample-counter-pane-title')).toHaveTextContent(
      'Counter',
    );

    // Check value display
    expect(screen.getByTestId('sample-counter-pane-value')).toHaveTextContent(
      'Value: 5',
    );

    // Check button
    expect(
      screen.getByTestId('sample-counter-pane-increment-button'),
    ).toHaveTextContent('Increment Redux Counter');
  });

  it('calls increment when button is clicked', () => {
    render(<SampleCounterPane />);

    fireEvent.click(screen.getByTestId('sample-counter-pane-increment-button'));

    expect(mockIncrement).toHaveBeenCalledTimes(1);
  });

  it('displays different counter values', () => {
    // Test with a different value
    setupMock(10);
    render(<SampleCounterPane />);

    expect(screen.getByTestId('sample-counter-pane-value')).toHaveTextContent(
      'Value: 10',
    );
  });

  it('handles error states gracefully', () => {
    // Test with an error state
    setupMock(0, new Error('Failed to load counter'));
    render(<SampleCounterPane />);

    // Component should still render even with an error
    expect(screen.getByTestId('sample-counter-pane-value')).toBeInTheDocument();
  });
});
