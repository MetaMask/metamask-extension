import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import {
  AccountGroupType,
  AccountWalletType,
  toAccountGroupId,
  toAccountWalletId,
  toMultichainAccountGroupId,
  toMultichainAccountWalletId,
} from '@metamask/account-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import { AccountManagementRow } from './account-management-row';
import { AccountManagementRowItem } from './account-management-list.utils';

const defaultWalletId = toMultichainAccountWalletId('01');
const defaultGroupId = toMultichainAccountGroupId(defaultWalletId, 0);

const createMockRowItem = (
  overrides?: Partial<AccountManagementRowItem>,
): AccountManagementRowItem => {
  const baseGroupId = overrides?.groupId ?? defaultGroupId;
  const baseWalletId = overrides?.walletId ?? defaultWalletId;
  const baseName = overrides?.groupData?.metadata?.name ?? 'Account 1';
  const isHidden = overrides?.isHidden ?? false;

  return {
    id: `account-${baseGroupId}`,
    groupId: baseGroupId,
    groupData: {
      id: baseGroupId,
      type: AccountGroupType.MultichainAccount,
      metadata: {
        name: baseName,
        pinned: false,
        hidden: isHidden,
        lastSelected: 0,
        entropy: { groupIndex: 0 },
      },
      accounts: ['0x1'],
      ...overrides?.groupData,
    },
    walletId: baseWalletId,
    walletName: 'Wallet 1',
    isPinned: false,
    isHidden,
    isLocked: false,
    isHardware: false,
    isImported: false,
    isRemovable: false,
    ...overrides,
  };
};

const hideModeGroupId = toMultichainAccountGroupId(defaultWalletId, 0);
/** Mode 1: Visible SRP / Entropy account — Eye hide action */
const hideModeItem = createMockRowItem({
  groupId: hideModeGroupId,
  groupData: {
    id: hideModeGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Account 1',
      pinned: false,
      hidden: false,
      lastSelected: 0,
      entropy: { groupIndex: 0 },
    },
    accounts: ['0x1'],
  },
  isRemovable: false,
  isImported: false,
  isHardware: false,
  isHidden: false,
});

const simpleKeyPairWalletId = toAccountWalletId(
  AccountWalletType.Keyring,
  KeyringTypes.simple,
);
const simpleKeyPairGroupId = toAccountGroupId(simpleKeyPairWalletId, '0');
/** Mode 2: Imported private-key account — Remove action */
const deleteModeImportedItem = createMockRowItem({
  groupId: simpleKeyPairGroupId,
  walletId: simpleKeyPairWalletId,
  walletName: 'Imported',
  groupData: {
    id: simpleKeyPairGroupId,
    type: AccountGroupType.SingleAccount,
    metadata: {
      name: 'Imported 1',
      pinned: false,
      hidden: false,
      lastSelected: 0,
    },
    accounts: ['0x1'],
  },
  isRemovable: true,
  isImported: true,
  isHardware: false,
  isHidden: false,
});

const ledgerWalletId = toAccountWalletId(
  AccountWalletType.Keyring,
  KeyringTypes.ledger,
);
const ledgerGroupId = toAccountGroupId(ledgerWalletId, '0');
/** Mode 2 variant: Hardware account — Remove action */
const deleteModeHardwareItem = createMockRowItem({
  groupId: ledgerGroupId,
  walletId: ledgerWalletId,
  walletName: 'Ledger',
  groupData: {
    id: ledgerGroupId,
    type: AccountGroupType.SingleAccount,
    metadata: {
      name: 'Ledger 1',
      pinned: false,
      hidden: false,
      lastSelected: 0,
    },
    accounts: ['0x1'],
  },
  isRemovable: true,
  isImported: false,
  isHardware: true,
  isLocked: true,
  isHidden: false,
});

const hiddenGroupId = toMultichainAccountGroupId(defaultWalletId, 2);
/** Mode 3: Already-hidden account — dimmed, EyeSlash unhide only */
const hiddenStateItem = createMockRowItem({
  groupId: hiddenGroupId,
  groupData: {
    id: hiddenGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Account 3 (Hidden)',
      pinned: false,
      hidden: true,
      lastSelected: 0,
      entropy: { groupIndex: 2 },
    },
    accounts: ['0x1'],
  },
  isRemovable: false,
  isHidden: true,
});

const InteractiveRow = (
  args: React.ComponentProps<typeof AccountManagementRow>,
) => {
  const [item, setItem] = useState(args.item);

  return (
    <AccountManagementRow
      {...args}
      item={item}
      onRenameAccount={(groupId, newName) => {
        setItem((prev) => ({
          ...prev,
          groupData: {
            ...prev.groupData,
            metadata: {
              ...prev.groupData.metadata,
              name: newName,
            },
          },
        }));
        args.onRenameAccount?.(groupId, newName);
      }}
      onToggleVisibility={(groupId, currentHidden) => {
        setItem((prev) => ({
          ...prev,
          isHidden: !currentHidden,
          groupData: {
            ...prev.groupData,
            metadata: {
              ...prev.groupData.metadata,
              hidden: !currentHidden,
            },
          },
        }));
        args.onToggleVisibility?.(groupId, currentHidden);
      }}
    />
  );
};

const StateLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    variant={TextVariant.BodyXs}
    color={TextColor.TextAlternative}
    fontWeight={FontWeight.Medium}
    className="mb-1 px-4"
  >
    {children}
  </Text>
);

const meta: Meta<typeof AccountManagementRow> = {
  title: 'Components/MultichainAccounts/AccountManagementRow',
  component: AccountManagementRow,
  parameters: {
    docs: {
      description: {
        component: `
Account Management rows have three mutually exclusive modes:

1. **Hide mode** — Visible SRP/entropy accounts show an Eye action to hide.
2. **Delete mode** — Imported and hardware accounts show a Remove action.
3. **Hidden state** — Dimmed rows; only the EyeSlash unhide control is interactive.
        `,
      },
    },
  },
  argTypes: {
    balance: { control: 'text' },
    privacyMode: { control: 'boolean' },
    showDefaultAddress: { control: 'boolean' },
    pending: { control: 'boolean' },
    onClick: { action: 'clicked' },
    onToggleVisibility: { action: 'visibilityToggled' },
    onRemoveAccount: { action: 'removeRequested' },
    onRenameAccount: { action: 'renameRequested' },
  },
  args: {
    item: hideModeItem,
    balance: '$10,728.46',
    privacyMode: false,
    showDefaultAddress: false,
    pending: false,
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
type Story = StoryObj<typeof AccountManagementRow>;

/**
 * Mode 1 — Visible SRP / Entropy account with Eye hide action.
 */
export const HideMode: Story = {
  name: '1. Hide Mode (SRP / Entropy)',
  render: (args) => <InteractiveRow {...args} />,
  args: {
    item: hideModeItem,
    balance: '$10,728.46',
    showDefaultAddress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Visible entropy/SRP account. Start accessory: Eye (hide). End accessory: balance + 6-dots drag handle. Row click navigates to account details.',
      },
    },
  },
};

/**
 * Mode 2 — Imported private-key account with Remove action.
 */
export const DeleteModeImported: Story = {
  name: '2a. Delete Mode (Imported)',
  render: (args) => <InteractiveRow {...args} />,
  args: {
    item: deleteModeImportedItem,
    balance: '$3,412.00',
    showDefaultAddress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Imported private-key account. Start accessory: Remove. End accessory: balance + 6-dots drag handle. Triggers account removal confirmation.',
      },
    },
  },
};

/**
 * Mode 2 — Hardware account with Remove action.
 */
export const DeleteModeHardware: Story = {
  name: '2b. Delete Mode (Hardware)',
  render: (args) => <InteractiveRow {...args} />,
  args: {
    item: deleteModeHardwareItem,
    balance: '$842.10',
    showDefaultAddress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hardware wallet account. Start accessory: Remove. End accessory: balance + 6-dots drag handle.',
      },
    },
  },
};

/**
 * Mode 3 — Already-hidden account: dimmed, unhide only.
 */
export const HiddenState: Story = {
  name: '3. Hidden State',
  render: (args) => <InteractiveRow {...args} />,
  args: {
    item: hiddenStateItem,
    balance: '$0.00',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dimmed (50% opacity). Non-interactive except EyeSlash unhide. No remove button, no navigation on click.',
      },
    },
  },
};

/**
 * Side-by-side comparison of all three design modes.
 */
export const AllStates: Story = {
  render: () => (
    <Box flexDirection={BoxFlexDirection.Column} gap={4}>
      <Box flexDirection={BoxFlexDirection.Column}>
        <StateLabel>1. Hide mode — visible SRP / entropy</StateLabel>
        <InteractiveRow
          item={hideModeItem}
          balance="$10,728.46"
          showDefaultAddress
          onClick={() => undefined}
          onToggleVisibility={() => undefined}
          onRenameAccount={() => undefined}
        />
      </Box>
      <Box flexDirection={BoxFlexDirection.Column}>
        <StateLabel>2. Delete mode — imported / hardware</StateLabel>
        <InteractiveRow
          item={deleteModeImportedItem}
          balance="$3,412.00"
          showDefaultAddress
          onClick={() => undefined}
          onRemoveAccount={() => undefined}
          onRenameAccount={() => undefined}
        />
        <InteractiveRow
          item={deleteModeHardwareItem}
          balance="$842.10"
          showDefaultAddress
          onClick={() => undefined}
          onRemoveAccount={() => undefined}
          onRenameAccount={() => undefined}
        />
      </Box>
      <Box flexDirection={BoxFlexDirection.Column}>
        <StateLabel>3. Hidden state — dimmed, unhide only</StateLabel>
        <InteractiveRow
          item={hiddenStateItem}
          balance="$0.00"
          onToggleVisibility={() => undefined}
        />
      </Box>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Visual comparison of the three Account Management row modes from the design spec.',
      },
    },
  },
};

export const Pending: Story = {
  render: (args) => <InteractiveRow {...args} />,
  args: {
    item: hideModeItem,
    pending: true,
    balance: '$10,728.46',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pending/creating account: reduced interactivity via MultichainAccountCell pending prop.',
      },
    },
  },
};

export const PrivacyMode: Story = {
  render: (args) => <InteractiveRow {...args} />,
  args: {
    item: hideModeItem,
    privacyMode: true,
    balance: '$10,728.46',
    showDefaultAddress: true,
  },
};
