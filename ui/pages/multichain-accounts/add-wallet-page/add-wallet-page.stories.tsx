import { StoryObj, Meta } from '@storybook/react';
import { AddWalletPage } from './add-wallet-page';

const meta: Meta<typeof AddWalletPage> = {
  title: 'Pages/MultichainAccounts/AddWalletPage',
  component: AddWalletPage,
};

export default meta;
type Story = StoryObj<typeof AddWalletPage>;

export const Default: Story = {};
