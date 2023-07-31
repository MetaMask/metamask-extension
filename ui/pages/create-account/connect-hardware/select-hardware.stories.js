import React from 'react';
import { action } from '@storybook/addon-actions';
import { LedgerTransportTypes } from '../../../../shared/constants/hardware-wallets';
import SelectHardware from './select-hardware';

export default {
  title: 'Pages/CreateAccount/ConnectHardware/SelectHardware',
};

export const DefaultStory = () => {
  return (
    <SelectHardware
      onCancel={() => null}
      browserSupported
      connectToHardwareWallet={(selectedDevice) =>
        action(`Continue connect to ${selectedDevice}`)()
      }
      ledgerTransportType={LedgerTransportTypes.live}
    />
  );
};

DefaultStory.storyName = 'Default';

export const BrowserNotSupported = () => {
  return (
    <SelectHardware
      onCancel={() => null}
      browserSupported={false}
      connectToHardwareWallet={() => undefined}
      ledgerTransportType={LedgerTransportTypes.live}
    />
  );
};
