import React from 'react';
import { action } from '@storybook/addon-actions';
import SelectHardware from './select-hardware';

export default {
  title: 'Connect Hardware Wallet',
  id: __filename,
};

export const SelectHardwareComponent = () => {
  return (
    <SelectHardware
      browserSupported
      connectToHardwareWallet={(selectedDevice) =>
        action(`Continue connect to ${selectedDevice}`)()
      }
      useLedgerLive
    />
  );
};
export const BrowserNotSupported = () => {
  return (
    <SelectHardware
      browserSupported={false}
      connectToHardwareWallet={() => undefined}
      useLedgerLive
    />
  );
};
