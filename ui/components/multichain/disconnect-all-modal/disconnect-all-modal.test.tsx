import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent, screen } from '../../../../test/jest';

import { DisconnectAllModal } from '.';
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
    render(<DisconnectAllModal {...args} />);
    fireEvent.click(screen.getByText('Disconnect'));
    expect(onClick).toHaveBeenCalled();
  });
});
