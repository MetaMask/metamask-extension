import type { Meta, StoryObj } from '@storybook/react';
import type { AccountWalletId } from '@metamask/account-api';
import { SrpCard } from './srp-card';
const WALLET_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ' as AccountWalletId;

const meta: Meta<typeof SrpCard> = {
  title: 'Components/Multichain/MultiSrp/SrpCard',
  component: SrpCard,
  args: {
    index: 0,
    walletId: WALLET_ID,
    shouldTriggerBackup: false,
    onActionComplete: () => undefined,
    isSettingsPage: false,
    hideShowAccounts: false,
  },
};

export default meta;
type Story = StoryObj<typeof SrpCard>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';
