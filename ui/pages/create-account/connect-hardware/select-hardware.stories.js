import React from 'react';
import { LedgerTransportTypes } from '../../../../shared/constants/hardware-wallets';
import SelectHardware from './select-hardware';

const mockTrackEvent = (event, properties) => {
  console.log('Mock track event:', { event, properties });
  return Promise.resolve();
};

export default {
  title: 'Pages/CreateAccount/ConnectHardware/SelectHardware',
};

export const DefaultStory = () => {
  return (
    <SelectHardware
      onCancel={() => null}
      browserSupported
      connectToHardwareWallet={() => {
        /* no-op */
      }}
      ledgerTransportType={LedgerTransportTypes.live}
      context={{
        trackEvent: mockTrackEvent,
      }}
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
      context={{
        trackEvent: mockTrackEvent,
      }}
    />
  );
};
