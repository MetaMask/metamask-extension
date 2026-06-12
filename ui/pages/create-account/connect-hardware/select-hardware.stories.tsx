import React from 'react';
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
        <div style={{ width: '400px', height: '600px' }}>
          <Story />
        </div>
      </MetaMetricsContext.Provider>
    ),
  ],
};

export const DefaultStory = () => {
  return (
    <SelectHardware
      browserSupported
      isFirefox={false}
      connectToHardwareWallet={() => {
        /* no-op */
      }}
    />
  );
};

DefaultStory.storyName = 'Default';

export const BrowserNotSupported = () => {
  return (
    <SelectHardware
      browserSupported={false}
      isFirefox={false}
      connectToHardwareWallet={() => {
        /* no-op */
      }}
    />
  );
};

export const FirefoxBrowser = () => {
  return (
    <SelectHardware
      browserSupported
      isFirefox
      connectToHardwareWallet={() => {
        /* no-op */
      }}
    />
  );
};
