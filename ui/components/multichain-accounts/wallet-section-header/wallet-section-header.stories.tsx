import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { WalletSectionHeader } from './wallet-section-header';

const InteractiveHeader = (
  args: React.ComponentProps<typeof WalletSectionHeader>,
) => {
  const [title, setTitle] = useState(args.title);
  const [isExpanded, setIsExpanded] = useState(args.isExpanded ?? true);

  return (
    <WalletSectionHeader
      {...args}
      title={title}
      isExpanded={isExpanded}
      onToggleExpand={() => {
        setIsExpanded((prev) => !prev);
        args.onToggleExpand?.();
      }}
      onRename={(newTitle) => {
        setTitle(newTitle);
        args.onRename?.(newTitle);
      }}
    />
  );
};

const meta: Meta<typeof WalletSectionHeader> = {
  title: 'Components/MultichainAccounts/WalletSectionHeader',
  component: WalletSectionHeader,
  parameters: {
    docs: {
      description: {
        component:
          'Header for wallet sections across Multichain Account List and Account Management screens with optional collapsing, locked status, remove action, inline rename, and drag handle.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    isCollapsible: { control: 'boolean' },
    isExpanded: { control: 'boolean' },
    isLocked: { control: 'boolean' },
    isRemovable: { control: 'boolean' },
    showDragHandle: { control: 'boolean' },
    onToggleExpand: { action: 'toggled' },
    onRemove: { action: 'removed' },
    onRename: { action: 'renamed' },
  },
  args: {
    title: 'Wallet 1',
    isCollapsible: false,
    isExpanded: true,
    isLocked: false,
    isRemovable: false,
    showDragHandle: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WalletSectionHeader>;

export const Default: Story = {
  render: (args) => <InteractiveHeader {...args} />,
};

export const Collapsible: Story = {
  render: (args) => <InteractiveHeader {...args} />,
  args: {
    isCollapsible: true,
    isExpanded: true,
  },
};

export const Locked: Story = {
  render: (args) => <InteractiveHeader {...args} />,
  args: {
    isCollapsible: true,
    isLocked: true,
  },
};

export const Removable: Story = {
  render: (args) => <InteractiveHeader {...args} />,
  args: {
    title: 'Wallet 2',
    isCollapsible: true,
    isRemovable: true,
  },
};

export const WithDragHandle: Story = {
  render: (args) => <InteractiveHeader {...args} />,
  args: {
    title: 'Wallet 2',
    isCollapsible: true,
    isRemovable: true,
    showDragHandle: true,
  },
};

export const WithRename: Story = {
  render: (args) => <InteractiveHeader {...args} />,
  args: {
    title: 'Wallet 2',
    isCollapsible: true,
    isRemovable: true,
    showDragHandle: true,
    onRename: () => undefined,
  },
};
