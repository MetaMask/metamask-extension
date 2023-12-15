/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

export default {
  title: 'Pages/ConfirmationPage/wallet_addEthereumChain',
  component: ConfirmationPage,
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={ApprovalType.AddEthereumChain}
      requestData={{
        chainName: 'Test Chain',
        chainId: '0x123',
        rpcUrl: 'https://test:com:8545',
        rpcPrefs: {
          blockExplorerUrl: 'https://test2.com',
        },
        ticker: 'TST',
      }}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
