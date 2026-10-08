import React from 'react';
import { render, screen } from '@testing-library/react';
import { OverflowMenu } from './overflow-menu';

describe('OverflowMenu', () => {
  it('connects the trigger to a menu containing each command', () => {
    const { container } = render(
      <OverflowMenu
        items={[
          {
            key: 'disable',
            label: 'Disable widget',
            command: 'show-modal',
            commandfor: 'disable-dialog',
          },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'More options' });
    const menu = container.querySelector('[popover="auto"]');
    const item = screen.getByRole('button', { name: 'Disable widget' });

    expect(menu).toHaveAttribute('id', trigger.getAttribute('commandfor'));
    expect(item).toHaveAttribute('command', 'show-modal');
    expect(item).toHaveAttribute('commandfor', 'disable-dialog');
  });
});
