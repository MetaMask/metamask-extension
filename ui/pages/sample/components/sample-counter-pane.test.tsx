import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SampleCounterPane } from './sample-counter-pane';

// Create mock functions
const mockIncrement = jest.fn();

// Mock the counter module
jest.mock('../../../ducks/sample/counter', () => {
  return {
    useCounter: () => ({
      value: 5,
      error: null,
      increment: mockIncrement,
      setCounter: jest.fn(),
    }),
  };
});

describe('SampleCounterPane', () => {
  // Create a mock store before each test
  let mockStore: ReturnType<typeof configureStore>;
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a fresh mock store for each test
    mockStore = configureStore([]);
    store = mockStore({
      sample: {
        counter: {
          value: 5,
          error: null,
        },
      },
    });
  });

  it('renders the counter component', () => {
    renderWithProvider(<SampleCounterPane />, store);

    expect(screen.getByText('Counter')).toBeInTheDocument();

    const valueElement = screen.getByText(/Value:/);
    expect(valueElement).toBeInTheDocument();

    expect(screen.getByText('Increment Redux Counter')).toBeInTheDocument();
  });

  it('calls increment when button is clicked', () => {
    renderWithProvider(<SampleCounterPane />, store);

    fireEvent.click(screen.getByText('Increment Redux Counter'));

    expect(mockIncrement).toHaveBeenCalled();
  });
});
