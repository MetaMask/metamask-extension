import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers';

import { DisconnectAllModal } from '.';

describe('DisconnectAllModal', () => {
  const onClick = jest.fn();

  const args = {
    onClose: jest.fn(),
    onClick,
    origin: 'https://example.com',
  };

  const renderModal = (props = {}) => {
    return renderWithLocalization(<DisconnectAllModal {...args} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = renderModal();
    expect(container).toMatchSnapshot();
  });

  it('should fire onClick when Disconnect All button is clicked', () => {
    renderModal();
    const disconnectAllButton = screen.getByTestId('disconnect-all');
    fireEvent.click(disconnectAllButton);
    expect(onClick).toHaveBeenCalled();
  });

  it('should render site-specific description with origin host', () => {
    renderModal({ origin: 'https://example.com' });
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(
      screen.getByText(/disconnect all your accounts from/iu),
    ).toBeInTheDocument();
  });
});
