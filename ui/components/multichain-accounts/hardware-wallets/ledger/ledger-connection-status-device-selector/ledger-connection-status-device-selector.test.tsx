import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { LedgerConnectionStatusDeviceSelectorProps } from './ledger-connection-status-device-selector.types';
import { LedgerConnectionStatusDeviceSelector } from '.';

const renderDeviceSelector = (
  props: LedgerConnectionStatusDeviceSelectorProps,
) => render(<LedgerConnectionStatusDeviceSelector {...props} />);

const getSelector = () =>
  screen.getByTestId('ledger-connection-status-device-selector');

describe('LedgerConnectionStatusDeviceSelector', () => {
  describe('static presentation', () => {
    it('renders the provided device model name', () => {
      renderDeviceSelector({ deviceModelName: 'Nano X' });

      expect(screen.getByText('Nano X')).toBeInTheDocument();
      expect(getSelector()).toBeInTheDocument();
    });

    it('omits the selection indicator for a single detected device', () => {
      renderDeviceSelector({ deviceModelName: 'Nano X' });

      expect(
        screen.queryByTestId(
          'ledger-connection-status-device-selector-indicator',
        ),
      ).not.toBeInTheDocument();
    });

    it('renders an empty model name as a non-interactive row', () => {
      renderDeviceSelector({ deviceModelName: '' });

      expect(getSelector()).toBeInTheDocument();
    });

    it('does not invoke onDeviceSelectorClick when device selection is disabled', async () => {
      const user = userEvent.setup();
      const onDeviceSelectorClick = jest.fn();

      renderDeviceSelector({
        deviceModelName: 'Nano X',
        deviceCount: 2,
        onDeviceSelectorClick,
      });

      await user.click(getSelector());

      expect(onDeviceSelectorClick).not.toHaveBeenCalled();
    });
  });

  describe('multiple device presentation', () => {
    it('renders the selection indicator when multiple devices are detected', () => {
      renderDeviceSelector({
        deviceModelName: 'Nano X',
        deviceCount: 2,
      });

      expect(
        screen.getByTestId(
          'ledger-connection-status-device-selector-indicator',
        ),
      ).toBeInTheDocument();
    });

    it('keeps the row non-interactive until device selection is enabled', async () => {
      const user = userEvent.setup();
      const onDeviceSelectorClick = jest.fn();

      renderDeviceSelector({
        deviceModelName: 'Nano X',
        deviceCount: 2,
        onDeviceSelectorClick,
      });

      await user.click(getSelector());

      expect(onDeviceSelectorClick).not.toHaveBeenCalled();
    });
  });

  describe('clickable presentation', () => {
    it('invokes onDeviceSelectorClick when the selector is clicked', async () => {
      const user = userEvent.setup();
      const onDeviceSelectorClick = jest.fn();

      renderDeviceSelector({
        deviceModelName: 'Stax',
        deviceCount: 2,
        isDeviceSelectionEnabled: true,
        onDeviceSelectorClick,
      });

      await user.click(getSelector());

      expect(onDeviceSelectorClick).toHaveBeenCalledTimes(1);
    });

    it('does not invoke onDeviceSelectorClick for a single detected device', async () => {
      const user = userEvent.setup();
      const onDeviceSelectorClick = jest.fn();

      renderDeviceSelector({
        deviceModelName: 'Nano X',
        deviceCount: 1,
        isDeviceSelectionEnabled: true,
        onDeviceSelectorClick,
      });

      await user.click(getSelector());

      expect(onDeviceSelectorClick).not.toHaveBeenCalled();
    });
  });
});
