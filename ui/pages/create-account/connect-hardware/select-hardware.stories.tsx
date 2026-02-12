import React from 'react';
import { action } from '@storybook/addon-actions';
import { LedgerTransportTypes } from '../../../../shared/constants/hardware-wallets';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import SelectHardware from './select-hardware';

const mockMetaMetricsContext = {
  trackEvent: () => Promise.resolve(),
  bufferedTrace: () => Promise.resolve(undefined),
  bufferedEndTrace: () => undefined,
  onboardingParentContext: { current: null },
};

export default {
  title: 'Pages/CreateAccount/ConnectHardware/SelectHardware',
  decorators: [
    (Story: () => JSX.Element) => (
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <Story />
      </MetaMetricsContext.Provider>
    ),
  ],
};

export const DefaultStory = () => {
  return (
    <SelectHardware
      onCancel={() => null}
      browserSupported
      connectToHardwareWallet={(selectedDevice: string) =>
        action(`Continue connect to ${selectedDevice}`)()
      }
      ledgerTransportType={LedgerTransportTypes.webhid}
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
      ledgerTransportType={LedgerTransportTypes.webhid}
    />
  );
};
