import React from 'react';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { CreateBtcAccount } from '.';

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
