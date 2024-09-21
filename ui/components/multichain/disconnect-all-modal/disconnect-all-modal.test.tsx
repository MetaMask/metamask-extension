import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '../../../../test/jest';

import { DisconnectType } from './disconnect-all-modal';
import { DisconnectAllModal } from '.';

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
