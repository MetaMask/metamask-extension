import React, { useState } from 'react';
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
import { Box, Icon, IconName, Checkbox } from '../../component-library';

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

const CheckboxAccessory = ({ checked = false }: { checked?: boolean }) => (
  <Box
    display={Display.Flex}
    alignItems={AlignItems.center}
    justifyContent={JustifyContent.center}
    marginRight={2}
  >
    <Checkbox isChecked={checked} />
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
    startAccessory: {
      control: false,
      description:
        'Optional component to display at the start of the cell (e.g., checkbox, radio button)',
    },
    endAccessory: {
      control: false,
      description: 'Optional component to display at the end of the cell',
    },
    avatarWrapper: {
      control: false,
      description:
        'When provided, wraps the account avatar (e.g. to attach a hover popover). Receives the avatar node and should return the wrapped node.',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the account is selected',
    },
  },
  args: {
    accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
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
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Selected Account',
  balance: '$2,400.00',
  selected: true,
};

export const WithoutBalance = Template.bind({});
WithoutBalance.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Account 2',
  balance: undefined,
};

export const WithoutEndAccessory = Template.bind({});
WithoutEndAccessory.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Account Without Menu',
  balance: '$2,400.00',
  endAccessory: undefined,
};

export const WithLongAccountName = Template.bind({});
WithLongAccountName.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName:
    'This is a very long account name that might need to be truncated',
  balance: '$2,400.00',
};

export const Clickable = Template.bind({});
Clickable.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Clickable Account',
  balance: '$2,400.00',
  onClick: () => console.log('Account cell clicked'),
};

export const SelectedAndClickable = Template.bind({});
SelectedAndClickable.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Selected Clickable Account',
  balance: '$2,400.00',
  selected: true,
  onClick: () => console.log('Selected account cell clicked'),
};

export const WithCheckboxAccessory = Template.bind({});
WithCheckboxAccessory.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Account with Checkbox',
  balance: '$2,400.00',
  startAccessory: <CheckboxAccessory checked={false} />,
  endAccessory: <MoreOptionsAccessory />,
};

export const WithCheckedCheckboxAccessory = Template.bind({});
WithCheckedCheckboxAccessory.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Selected Account with Checkbox',
  balance: '$2,400.00',
  startAccessory: <CheckboxAccessory checked={true} />,
  endAccessory: <MoreOptionsAccessory />,
  selected: true,
};

const HoverableAvatarWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-4px)',
            padding: '6px 10px',
            backgroundColor: 'var(--color-background-default, #fff)',
            border: '1px solid var(--color-border-muted, #b0b0b0)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          Hover for address list
        </div>
      )}
    </div>
  );
};

export const WithAvatarWrapper = Template.bind({});
WithAvatarWrapper.storyName = 'With Avatar Wrapper';
WithAvatarWrapper.args = {
  accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  accountName: 'Account with wrapped avatar',
  balance: '$2,400.00',
  endAccessory: <MoreOptionsAccessory />,
  avatarWrapper: (avatar) => (
    <HoverableAvatarWrapper>{avatar}</HoverableAvatarWrapper>
  ),
};
WithAvatarWrapper.parameters = {
  docs: {
    description: {
      story:
        'When `avatarWrapper` is provided, the account avatar is passed to it and the returned node is rendered (e.g. to wrap the avatar in a popover trigger for address rows). Hover the avatar to see the tooltip.',
    },
  },
};

export const MultipleAccounts: StoryFn<typeof MultichainAccountCell> = () => (
  <div style={{ width: '360px', margin: '0 auto' }}>
    <MultichainAccountCell
      accountId="entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0"
      accountName="Main Account"
      balance="$2,400.00"
      onClick={() => console.log('Main account clicked')}
      endAccessory={<MoreOptionsAccessory />}
    />
    <MultichainAccountCell
      accountId="entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0"
      accountName="Savings"
      balance="$105,400,720.00"
      onClick={() => console.log('Savings account clicked')}
      endAccessory={<MoreOptionsAccessory />}
      selected={true}
    />
    <MultichainAccountCell
      accountId="entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0"
      accountName="Trading"
      balance="$22,400.00"
      onClick={() => console.log('Trading account clicked')}
      startAccessory={<CheckboxAccessory checked={true} />}
      endAccessory={<MoreOptionsAccessory />}
    />
  </div>
);

export const MultipleAccountsWithStartAccessories: StoryFn<
  typeof MultichainAccountCell
> = () => (
  <div style={{ width: '360px', margin: '0 auto' }}>
    <MultichainAccountCell
      accountId="entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0"
      accountName="Unchecked Account"
      balance="$2,400.00"
      onClick={() => console.log('Unchecked account clicked')}
      startAccessory={<CheckboxAccessory checked={false} />}
      endAccessory={<MoreOptionsAccessory />}
    />
    <MultichainAccountCell
      accountId="entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0"
      accountName="Checked Account"
      balance="$105,400,720.00"
      onClick={() => console.log('Checked account clicked')}
      startAccessory={<CheckboxAccessory checked={true} />}
      endAccessory={<MoreOptionsAccessory />}
      selected={true}
    />
  </div>
);
