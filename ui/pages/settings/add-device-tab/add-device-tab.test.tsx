import React from 'react';
import { render, screen } from '@testing-library/react';
import AddDeviceTab from './add-device-tab';

jest.mock('./add-device-settings', () => () => (
  <div data-testid="add-device-settings" />
));

describe('AddDeviceTab', () => {
  it('renders without throwing', () => {
    expect(() => render(<AddDeviceTab />)).not.toThrow();
  });

  it('renders the add device settings', () => {
    render(<AddDeviceTab />);

    expect(screen.getByTestId('add-device-settings')).toBeInTheDocument();
  });
});
