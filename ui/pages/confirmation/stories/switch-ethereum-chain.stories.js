/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

export default {
  title: 'Pages/ConfirmationPage/wallet_switchEthereumChain',
  component: ConfirmationPage,
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={ApprovalType.SwitchEthereumChain}
      requestData={{
        fromNetworkConfiguration: {
          nickname: 'Test Network 1',
          chainId: '0x123',
          iconUrl: './images/eth_logo.png',
        },
        toNetworkConfiguration: {
          nickname: 'Test Network 2',
          chainId: '0x456',
          iconUrl: './images/bnb.png',
        },
      }}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
