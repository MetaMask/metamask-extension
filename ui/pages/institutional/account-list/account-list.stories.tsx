import React from 'react';
import CustodyAccountList from '.';

const testAccounts = [
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Test Account 1',
    chainId: 1,
  },
  {
    address: '0x0987654321098765432109876543210987654321',
    name: 'Test Account 2',
    chainId: 1,
  },
];

export default {
  title: 'Pages/Institutional/CustodyAccountList',
  component: CustodyAccountList,
  args: {
    custody: 'Test',
    accounts: testAccounts,
    onAccountChange: () => undefined,
    selectedAccounts: {},
    onAddAccounts: () => undefined,
    onCancel: () => undefined,
    rawList: false,
  },
};

export const DefaultStory = (args) => <CustodyAccountList {...args} />;

DefaultStory.storyName = 'CustodyAccountList';
