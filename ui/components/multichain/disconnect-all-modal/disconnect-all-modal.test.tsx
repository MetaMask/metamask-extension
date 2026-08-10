import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers';

import { DisconnectAllModal } from '.';

describe('DisconnectAllModal', () => {
  const onClick = jest.fn();

  const args = {
    onClose: jest.fn(),
    onClick,
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

  describe('with origin prop', () => {
    it('should render site-specific description when origin is provided', () => {
      renderModal({ origin: 'https://example.com' });
      expect(screen.getByText('example.com')).toBeInTheDocument();
      expect(
        screen.getByText(/disconnect all your accounts from/iu),
      ).toBeInTheDocument();
    });

    it('should render generic description when origin is not provided', () => {
      renderModal();
      expect(
        screen.getByText(/need to reconnect your accounts and networks/iu),
      ).toBeInTheDocument();
    });
  });
});
