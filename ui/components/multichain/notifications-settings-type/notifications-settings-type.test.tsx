import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconName } from '../../component-library';
import { NotificationsSettingsType } from './notifications-settings-type';

describe('NotificationsSettingsType', () => {
  it('renders the component with required props', () => {
    const title = 'Test Title';
    render(<NotificationsSettingsType title={title} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders the component with an icon', () => {
    const title = 'Test Title with Icon';
    const icon: IconName = IconName.Bank;
    render(<NotificationsSettingsType title={title} icon={icon} />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders the component with additional text', () => {
    const title = 'Test Title';
    const text = 'Additional text for testing';
    render(<NotificationsSettingsType title={title} text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
