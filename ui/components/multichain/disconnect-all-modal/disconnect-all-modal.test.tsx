import { render } from '@testing-library/react';
import React from 'react';

import { DisconnectAllModal } from '.';
import { fireEvent } from '../../../../test/jest';
import { DisconnectType } from './disconnect-all-modal';

describe('DisconnectAllModal', () => {
  const onClick = jest.fn();

  const args = {
    type: DisconnectType.Account,
    hostname: 'portfolio.metamask.io',
    onClose: jest.fn(),
    onClick,
  };

  it('should render correctly', () => {
    const { container } = render(<DisconnectAllModal {...args} />);
    expect(container).toMatchSnapshot();
  });

  it('should fire onClick when Disconnect All button is clicked', () => {
    const { getByTestId } = render(<DisconnectAllModal {...args} />);
    const disconnectAllButton = getByTestId('disconnect-all');
    fireEvent.click(disconnectAllButton);
    expect(onClick).toHaveBeenCalled();
  });
});
