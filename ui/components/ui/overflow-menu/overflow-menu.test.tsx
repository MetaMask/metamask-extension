import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconName } from '@metamask/design-system-react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
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

    const trigger = screen.getByRole('button', {
      name: messages.moneyMoreOptions.message,
    });
    const menu = container.querySelector('[popover="auto"]');
    const item = screen.getByRole('button', { name: 'Disable widget' });

    expect(menu).toHaveAttribute('id', trigger.getAttribute('commandfor'));
    expect(item).toHaveAttribute('command', 'show-modal');
    expect(item).toHaveAttribute('commandfor', 'disable-dialog');
  });

  it('renders items with icons when iconName is provided', () => {
    render(
      <OverflowMenu
        items={[
          {
            key: 'settings',
            label: 'Settings',
            iconName: IconName.Setting,
          },
        ]}
      />,
    );

    const item = screen.getByRole('button', {
      name: messages.settings.message,
    });
    expect(item).toBeInTheDocument();
  });

  it('calls onClick when item is clicked', () => {
    const handleClick = jest.fn();
    render(
      <OverflowMenu
        items={[
          {
            key: 'action',
            label: 'Action',
            onClick: handleClick,
          },
        ]}
      />,
    );

    const item = screen.getByRole('button', { name: 'Action' });
    item.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled prop', () => {
    render(
      <OverflowMenu
        items={[
          {
            key: 'action',
            label: 'Action',
          },
        ]}
        disabled
      />,
    );

    const trigger = screen.getByRole('button', {
      name: messages.moneyMoreOptions.message,
    });
    expect(trigger).toBeDisabled();
  });

  it('applies custom testId', () => {
    render(
      <OverflowMenu
        items={[
          {
            key: 'action',
            label: 'Action',
          },
        ]}
        testId="custom-menu"
      />,
    );

    expect(screen.getByTestId('custom-menu')).toBeInTheDocument();
  });

  it('uses custom ariaLabel', () => {
    render(
      <OverflowMenu
        items={[
          {
            key: 'action',
            label: 'Action',
          },
        ]}
        ariaLabel="Custom label"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Custom label' }),
    ).toBeInTheDocument();
  });
});
