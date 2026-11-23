import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Icon, IconName } from '@metamask/design-system-react';
import { SideNavAccountCell } from './side-nav-account-cell';

const MenuAccessory = ({ expanded = false }: { expanded?: boolean }) => (
  <div
    aria-expanded={expanded}
    className="flex size-7 items-center justify-center rounded-lg bg-background-muted"
  >
    <Icon name={IconName.MoreVertical} />
  </div>
);

const meta: Meta<typeof SideNavAccountCell> = {
  title: 'Components/App/SideNav/SideNavAccountCell',
  component: SideNavAccountCell,
  args: {
    accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
    accountName: 'Account 1',
    balance: '$245.50',
    showDefaultAddress: true,
    endAccessory: <MenuAccessory />,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SideNavAccountCell>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
    accountName: 'CSI Test - old',
  },
};

export const Pending: Story = {
  args: {
    pending: true,
  },
};

export const Privacy: Story = {
  args: {
    privacyMode: true,
  },
};

export const WalletName: Story = {
  args: {
    showDefaultAddress: false,
    walletName: 'Wallet 1',
  },
};

export const MenuOpen: Story = {
  args: {
    endAccessory: <MenuAccessory expanded />,
  },
};
