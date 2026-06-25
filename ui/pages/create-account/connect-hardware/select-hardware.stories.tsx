import React from 'react';
import SelectHardware from './select-hardware';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: () => undefined,
      createEventBuilder,
    }),
  };
});

export default {
  title: 'Pages/CreateAccount/ConnectHardware/SelectHardware',
  decorators: [
    (Story: () => JSX.Element) => (
      <div style={{ width: '400px', height: '600px' }}>
        <Story />
      </div>
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
