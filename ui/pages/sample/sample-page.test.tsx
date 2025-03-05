import React from 'react';
import { screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getCurrentNetwork } from '../../selectors';
import { SamplePage } from './sample-page';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

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
  const mockNetworkDetails = {
    nickname: 'Custom Network',
    rpcPrefs: {
      imageUrl: 'https://test.network/image.png',
    },
  };

  const mockHistoryPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useHistory as jest.Mock).mockReturnValue({ push: mockHistoryPush });

    (useSelector as jest.Mock).mockImplementation((selectorFn) =>
      selectorFn === getCurrentNetwork ? mockNetworkDetails : {},
    );
  });

  it('renders the sample page with correct structure and text', () => {
    renderWithProvider(<SamplePage />);

    // Verify the page container
    expect(screen.getByTestId('sample-page')).toBeInTheDocument();

    // Check for header text
    expect(screen.getByText('Sample Feature')).toBeInTheDocument();

    expect(
      screen.getByText(
        'This is a page demonstrating how to build a sample feature end-to-end in MetaMask.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Custom Network')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sample-counter-pane')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sample-petnames-form')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    renderWithProvider(<SamplePage />);

    const backButton = screen.getByLabelText('[back]');
    backButton.click();

    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });
});
