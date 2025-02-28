import React from 'react';
import { screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { SamplePage } from './sample-page';

// Mock the useHistory hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

// Mock useSelector
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

// Mock the components used in SamplePage
jest.mock('./components/sample-counter-pane', () => ({
  SampleCounterPane: () => (
    <div data-testid="mock-sample-counter-pane">Mock Counter Component</div>
  ),
}));

jest.mock('./components/sample-petnames-form', () => ({
  SamplePetnamesForm: () => (
    <div data-testid="mock-sample-petnames-form">
      Mock Petnames Form Component
    </div>
  ),
}));

describe('SamplePage', () => {
  const mockHistoryPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useHistory as jest.Mock).mockReturnValue({
      push: mockHistoryPush,
    });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the getCurrentNetwork selector
      return {
        nickname: 'Test Network',
        rpcPrefs: {
          imageUrl: 'https://test.network/image.png',
        },
      };
    });
  });

  it('renders the sample page with all components', () => {
    renderWithProvider(<SamplePage />);

    // Check for header text
    expect(screen.getByText('Sample Feature')).toBeInTheDocument();

    // Check for description text
    expect(
      screen.getByText(
        'This is a page demonstrating how to build a sample feature end-to-end in MetaMask.',
      ),
    ).toBeInTheDocument();

    // Check for network display
    expect(screen.getByText('Test Network')).toBeInTheDocument();

    // Check that child components are rendered
    expect(screen.getByTestId('mock-sample-counter-pane')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sample-petnames-form')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    renderWithProvider(<SamplePage />);

    // Find back button by its aria-label and click it
    const backButton = screen.getByLabelText('[back]');
    backButton.click();

    // Check that history.push was called with the correct route
    expect(mockHistoryPush).toHaveBeenCalledWith('/');
  });
});
