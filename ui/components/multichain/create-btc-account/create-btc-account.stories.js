import React from 'react';
import { CreateBtcAccount } from '.';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

export default {
  title: 'Components/Multichain/CreateBtcAccount',
  component: CreateBtcAccount,
  args: {
    defaultAccountName: 'Bitcoin Account',
    network: MultichainNetworks.BITCOIN,
  },
};

export const DefaultStory = (args) => <CreateBtcAccount {...args} />;
DefaultStory.storyName = 'Default';
