import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { MultichainAccountCell } from './multichain-account-cell';
import { MultichainAccountCellProps } from './multichain-account-cell';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box, Icon, IconName } from '../../component-library';

// End accessory
const MoreOptionsAccessory = () => (
  <Box
    display={Display.Flex}
    alignItems={AlignItems.center}
    justifyContent={JustifyContent.center}
    backgroundColor={BackgroundColor.backgroundMuted}
    borderRadius={BorderRadius.LG}
    padding={1}
  >
    <Icon name={IconName.MoreVertical} />
  </Box>
);

export default {
  title: 'Components/MultichainAccounts/MultichainAccountCell',
  component: MultichainAccountCell,
  parameters: {
    docs: {
      description: {
        component:
          'A reusable component for displaying account information in a compact cell format.',
      },
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    accountId: {
      control: 'text',
      description: 'Unique identifier for the account',
    },
    accountName: {
      control: 'text',
      description: 'Display name of the account',
    },
    balance: {
      control: 'text',
      description: 'Optional balance to display for the account',
    },
    onClick: {
      control: false,
      description: 'Optional click handler for the cell',
      action: 'clicked',
    },
    endAccessory: {
      control: false,
      description: 'Optional component to display at the end of the cell',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the account is selected',
    },
  },
  args: {
    accountId: '0x1234567890abcdef',
    accountName: 'Account 1',
    balance: '$2,400.00',
    selected: false,
    endAccessory: <MoreOptionsAccessory />,
  },
} as Meta<typeof MultichainAccountCell>;

const Template: StoryFn<typeof MultichainAccountCell> = (
  args: MultichainAccountCellProps,
) => (
  <div style={{ width: '360px', margin: '0 auto' }}>
    <MultichainAccountCell {...args} />
  </div>
);

export const Default = Template.bind({});
Default.storyName = 'Default';

export const Selected = Template.bind({});
Selected.args = {
  accountId: '0x1234567890abcdef',
  accountName: 'Selected Account',
  balance: '$2,400.00',
  selected: true,
};

export const WithoutBalance = Template.bind({});
WithoutBalance.args = {
  accountId: '0x2345678901abcdef',
  accountName: 'Account 2',
  balance: undefined,
};

export const WithoutEndAccessory = Template.bind({});
WithoutEndAccessory.args = {
  accountId: '0x5678901234abcdef',
  accountName: 'Account Without Menu',
  balance: '$2,400.00',
  endAccessory: undefined,
};

export const WithLongAccountName = Template.bind({});
WithLongAccountName.args = {
  accountId: '0x3456789012abcdef',
  accountName:
    'This is a very long account name that might need to be truncated',
  balance: '$2,400.00',
};

export const Clickable = Template.bind({});
Clickable.args = {
  accountId: '0x4567890123abcdef',
  accountName: 'Clickable Account',
  balance: '$2,400.00',
  onClick: () => console.log('Account cell clicked'),
};

export const SelectedAndClickable = Template.bind({});
SelectedAndClickable.args = {
  accountId: '0x6789012345abcdef',
  accountName: 'Selected Clickable Account',
  balance: '$2,400.00',
  selected: true,
  onClick: () => console.log('Selected account cell clicked'),
};

export const MultipleAccounts: StoryFn<typeof MultichainAccountCell> = () => (
  <div style={{ width: '360px', margin: '0 auto' }}>
    <MultichainAccountCell
      accountId="0x1234567890abcdef"
      accountName="Main Account"
      balance="$2,400.00"
      onClick={() => console.log('Main account clicked')}
      endAccessory={<MoreOptionsAccessory />}
    />
    <MultichainAccountCell
      accountId="0x2345678901abcdef"
      accountName="Savings"
      balance="$105,400,720.00"
      onClick={() => console.log('Savings account clicked')}
      endAccessory={<MoreOptionsAccessory />}
      selected={true}
    />
    <MultichainAccountCell
      accountId="0x3456789012abcdef"
      accountName="Trading"
      balance="$22,400.00"
      onClick={() => console.log('Trading account clicked')}
      endAccessory={<MoreOptionsAccessory />}
    />
    <MultichainAccountCell
      accountId="0x3456789012abcdef"
      accountName="Second trading account"
      balance="$178,256,100.00"
      onClick={() => console.log('Second trading account clicked')}
      endAccessory={<MoreOptionsAccessory />}
    />
    <MultichainAccountCell
      accountId="0x3456789012abcdef"
      accountName="Second savings account"
      balance="1722.943 ETH"
      onClick={() => console.log('Second savings account clicked')}
      endAccessory={<MoreOptionsAccessory />}
    />
  </div>
);
