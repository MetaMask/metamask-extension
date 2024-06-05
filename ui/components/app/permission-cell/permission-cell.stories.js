import React from 'react';
import { Text } from '../../component-library';
import { FontWeight } from '../../../helpers/constants/design-system';
import PermissionCell from '.';

export default {
  title: 'Components/App/PermissionCell',

  component: PermissionCell,
};

export const DefaultStory = (args) => <PermissionCell {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  title: 'Access the Ethereum provider.',
  description:
    'Allow the snap to communicate with MetaMask direct…blockchain and suggest messages and transactions.',
  weight: 1,
  avatarIcon: 'ethereum',
  dateApproved: 1680185432326,
  revoked: false,
};

const accounts = [
  {
    avatarValue: '0xBc641D258aA0e90F70AaDbcC4dE2D58d88029713',
    avatarName: 'DeFi wallet',
  },
  {
    avatarValue: '0xb366c9f33845fa39425d2e123F57a40A28a015ba',
    avatarName: 'NFT Account',
  },
  {
    avatarValue: '0x3606282D9faAdB3BDc1745e5ae857B02d18e2405',
    avatarName: 'Gaming account',
  },
  {
    avatarValue: '0x7695090F30987985ae8A36752eFF35d639F0EaE5',
    avatarName: 'Savings account',
  },
  {
    avatarValue: '0xE157Ff524673cB24E63C2936d7323813784E0151',
    avatarName: 'Some other account',
  },
];

export const RequestedPermission = (args) => <PermissionCell {...args} />;

RequestedPermission.args = {
  title: 'Fetch and display transaction insights.',
  description: `Allow Transaction Insight Snap
      to decode transactions and show insights within the MetaMask UI. This can
      be used for anti-phishing and security solutions.`,
  weight: 3,
  avatarIcon: 'speedometer',
};

export const RevokedPermission = (args) => <PermissionCell {...args} />;

RevokedPermission.args = {
  title: 'Fetch and display transaction insights.',
  description: `Allow Transaction Insight Snap
      to decode transactions and show insights within the MetaMask UI. This can
      be used for anti-phishing and security solutions.`,
  weight: 3,
  avatarIcon: 'speedometer',
  revoked: true,
};

export const RequestedForAccounts = (args) => <PermissionCell {...args} />;

RequestedForAccounts.args = {
  title: 'Display notifications in MetaMask',
  weight: 3,
  avatarIcon: 'notification',
  accounts,
};

export const ApprovedForAccounts = (args) => <PermissionCell {...args} />;

ApprovedForAccounts.args = {
  title: 'Display notifications in MetaMask',
  weight: 3,
  avatarIcon: 'notification',
  dateApproved: 1680185432326,
  accounts,
};

export const RevokedForAccounts = (args) => <PermissionCell {...args} />;

RevokedForAccounts.args = {
  title: 'Display notifications in MetaMask',
  weight: 3,
  avatarIcon: 'notification',
  revoked: true,
  accounts,
};

export const CustomPermissionSubject = (args) => <PermissionCell {...args} />;

CustomPermissionSubject.args = {
  title: (
    <Text>
      <Text as="span" fontWeight={FontWeight.Bold}>
        app.uniswap.org
      </Text>{' '}
      can see the account balance, address, activity, and suggest transactions
      to approve.
    </Text>
  ),
  weight: 3,
  avatarIcon: 'wallet',
  dateApproved: 1680185432326,
};
