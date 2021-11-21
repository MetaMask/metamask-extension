import React from 'react';
import { action } from '@storybook/addon-actions';
import { LEDGER_TRANSPORT_TYPES } from '../../../../shared/constants/hardware-wallets';
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
      ledgerTransportType={LEDGER_TRANSPORT_TYPES.LIVE}
    />
  );
};
export const BrowserNotSupported = () => {
  return (
    <SelectHardware
      browserSupported={false}
      connectToHardwareWallet={() => undefined}
      ledgerTransportType={LEDGER_TRANSPORT_TYPES.LIVE}
    />
  );
};
