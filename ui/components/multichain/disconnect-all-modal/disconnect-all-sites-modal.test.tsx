import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '../../../../test/jest';
import { DisconnectAllSitesModal } from './disconnect-all-sites-modal';

const mockOnClick = jest.fn();
const mockOnClose = jest.fn();

describe('DisconnectAllSitesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    const { container } = render(
      <DisconnectAllSitesModal
        isOpen
        onClick={mockOnClick}
        onClose={mockOnClose}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('does not render when closed', () => {
    const { queryByTestId } = render(
      <DisconnectAllSitesModal
        isOpen={false}
        onClick={mockOnClick}
        onClose={mockOnClose}
      />,
    );

    expect(queryByTestId('disconnect-all-sites-modal')).not.toBeInTheDocument();
  });

  it('calls onClick when confirm button is clicked', () => {
    const { getByTestId } = render(
      <DisconnectAllSitesModal
        isOpen
        onClick={mockOnClick}
        onClose={mockOnClose}
      />,
    );

    fireEvent.click(getByTestId('disconnect-all-sites-confirm'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const { getByRole } = render(
      <DisconnectAllSitesModal
        isOpen
        onClick={mockOnClick}
        onClose={mockOnClose}
      />,
    );

    // Click the close button in the header
    const closeButton = getByRole('button', { name: /close/iu });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
