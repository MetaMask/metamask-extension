import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { MultichainAccountAvatarGroup } from './multichain-avatar-group';

// Reusable avatar data for consistency across stories
const mockAvatar1 = {
  avatarValue: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  symbol: 'ETH',
};

const mockAvatar2 = {
  avatarValue: '0x123456789abcdef0123456789abcdef012345678',
  symbol: 'MATIC',
};

const mockAvatar3 = {
  avatarValue: '0xabcdef1234567890abcdef1234567890abcdef12',
  symbol: 'BNB',
};

const mockAvatar4 = {
  avatarValue: '0x987654321fedcba0987654321fedcba0987654321',
  symbol: 'USDC',
};

const mockAvatar5 = {
  avatarValue: '0x5555555555555555555555555555555555555555',
  symbol: 'DAI',
};

export default {
  title: 'Components/MultichainAccounts/MultichainAccountAvatarGroup',
  component: MultichainAccountAvatarGroup,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a group of account avatars with configurable limits and styling',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class name for styling',
    },
    limit: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of avatars to display',
    },
    members: {
      control: 'object',
      description:
        'Array of member objects with avatarValue and optional symbol',
    },
  },
} as Meta<typeof MultichainAccountAvatarGroup>;

const Template: StoryFn<typeof MultichainAccountAvatarGroup> = (args) => (
  <div
    style={{
      width: '300px',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#f5f5f5',
    }}
  >
    <MultichainAccountAvatarGroup {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  members: [mockAvatar1, mockAvatar2, mockAvatar3],
};

export const WithLimit = Template.bind({});
WithLimit.args = {
  members: [mockAvatar1, mockAvatar2, mockAvatar3, mockAvatar4, mockAvatar5],
  limit: 3,
};

export const ManyMembers = Template.bind({});
ManyMembers.args = {
  members: Array.from({ length: 10 }, (_, index) => ({
    avatarValue: `0x${index.toString().padStart(40, '0')}`,
    symbol: `TOKEN${index}`,
  })),
  limit: 4,
};

export const SingleMember = Template.bind({});
SingleMember.args = {
  members: [mockAvatar1],
};

export const NoSymbols = Template.bind({});
NoSymbols.args = {
  members: [
    { avatarValue: mockAvatar1.avatarValue },
    { avatarValue: mockAvatar2.avatarValue },
    { avatarValue: mockAvatar3.avatarValue },
  ],
};

export const EmptyGroup = Template.bind({});
EmptyGroup.args = {
  members: [],
};

export const WithCustomClassName = Template.bind({});
WithCustomClassName.args = {
  members: [mockAvatar1, mockAvatar2, mockAvatar3],
  className: 'custom-avatar-group-class',
};

export const HighLimit = Template.bind({});
HighLimit.args = {
  members: [mockAvatar1, mockAvatar2, mockAvatar3],
  limit: 10,
};
