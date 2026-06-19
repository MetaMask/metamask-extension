import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { LedgerConnectionStatusDeviceSelectorProps } from './ledger-connection-status-device-selector.types';
import { LedgerConnectionStatusDeviceSelector } from '.';

const renderDeviceSelector = (
  props: LedgerConnectionStatusDeviceSelectorProps,
) => render(<LedgerConnectionStatusDeviceSelector {...props} />);

describe('LedgerConnectionStatusDeviceSelector', () => {
  describe('static presentation', () => {
    it('renders the provided device model name', () => {
      renderDeviceSelector({ deviceModelName: 'Nano X' });

      expect(screen.getByText('Nano X')).toBeInTheDocument();
      expect(
        screen.getByTestId('ledger-connection-status-device-selector'),
      ).toBeInTheDocument();
    });

    it('renders an empty model name without a clickable wrapper', () => {
      renderDeviceSelector({ deviceModelName: '' });

      expect(
        screen.getByTestId('ledger-connection-status-device-selector'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('ledger-connection-status-device-selector-button'),
      ).not.toBeInTheDocument();
    });

    it('does not render a clickable wrapper without onDeviceSelectorClick', () => {
      renderDeviceSelector({ deviceModelName: 'Nano X' });

      expect(
        screen.queryByTestId('ledger-connection-status-device-selector-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('clickable presentation', () => {
    it('wraps the selector in a button when onDeviceSelectorClick is provided', () => {
      renderDeviceSelector({
        deviceModelName: 'Nano X',
        onDeviceSelectorClick: jest.fn(),
      });

      expect(
        screen.getByTestId('ledger-connection-status-device-selector-button'),
      ).toBeInTheDocument();
    });

    it('invokes onDeviceSelectorClick when the selector is clicked', async () => {
      const user = userEvent.setup();
      const onDeviceSelectorClick = jest.fn();

      renderDeviceSelector({
        deviceModelName: 'Stax',
        onDeviceSelectorClick,
      });

      await user.click(
        screen.getByTestId('ledger-connection-status-device-selector-button'),
      );

      expect(onDeviceSelectorClick).toHaveBeenCalledTimes(1);
    });
  });
});
