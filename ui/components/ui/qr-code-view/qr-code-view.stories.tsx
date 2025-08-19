import React from 'react';
import QrCodeView from '.';

const mockEthAddress = '0x467060a50CB7bBd2209017323b794130184195a0';
const mockBtcAddress = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

export default {
  title: 'Components/UI/QrCodeView',
  component: QrCodeView,
  argTypes: {
    Qr: {
      control: 'object',
    },
    warning: {
      control: 'text',
    },
    accountName: {
      control: 'text',
    },
    location: {
      control: 'text',
    },
  },
  args: {
    Qr: {
      message: 'Your Ethereum address',
      data: mockEthAddress,
    },
    warning: null,
    accountName: 'Account 1',
    location: 'Account Details Modal',
  },
};

export const DefaultStory = (args) => <QrCodeView {...args} />;
DefaultStory.storyName = 'Default';

export const WithoutAccountName = (args) => (
  <QrCodeView {...args} accountName={undefined} />
);

export const WithWarning = (args) => (
  <QrCodeView {...args} warning="This is a warning message" />
);

export const WithArrayOfMessages = (args) => (
  <QrCodeView
    {...args}
    Qr={{
      message: [
        'First warning message',
        'Second warning message',
        'Third warning message',
      ],
      data: args.Qr.data,
    }}
  />
);

export const BitcoinAddress = (args) => (
  <QrCodeView
    {...args}
    Qr={{
      message: 'Your Bitcoin address',
      data: mockBtcAddress,
    }}
    accountName="Bitcoin Wallet"
  />
);

export const MinimalEthAddress = (args) => (
  <QrCodeView
    {...args}
    Qr={{
      data: mockEthAddress,
    }}
    accountName={undefined}
    warning={null}
  />
);

export const LongAccountName = (args) => (
  <QrCodeView
    {...args}
    accountName="My Very Long Account Name That Should Test Text Wrapping"
  />
);

export const WithWarningAndMessages = (args) => (
  <QrCodeView
    {...args}
    Qr={{
      message: ['Important security notice', 'Please verify this address'],
      data: args.Qr.data,
    }}
    warning="Network connection unstable"
  />
);

export const DifferentLocation = (args) => (
  <QrCodeView {...args} location="Send Flow" />
);
