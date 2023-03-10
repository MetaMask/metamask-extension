import React from 'react';
import testData from '../../../../.storybook/test-data';
import { AccountListMenu } from './account-list-menu';

const [choasAddress, simpleAddress, hardwareAddress] = Object.keys(
  testData.metamask.identities,
);

const SimpleIdentity = {
  ...testData.metamask.identities[simpleAddress],
  balance: '0x152387ad22c3f0',
};

const ChaosIdentity = {
  ...testData.metamask.identities[choasAddress],
  balance: '0x152387ad22c3f0',
};

const HardwareIdentity = {
  ...testData.metamask.identities[hardwareAddress],
  balance: '0x152387ad22c3f0',
};

export default {
  title: 'Components/Multichain/AccountListMenu',
  component: AccountListMenu,
};

export const DefaultStory = () => (
  <AccountListMenu
    identities={[
      SimpleIdentity,
      ChaosIdentity,
      HardwareIdentity,
      SimpleIdentity,
      ChaosIdentity,
      HardwareIdentity,
    ]}
  />
);
