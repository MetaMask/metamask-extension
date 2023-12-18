import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

/**
 * An approval to add a network to the wallet.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.add` method with the `type` set to `wallet_addEthereumChain`.<br/><br/>
 * The below arguments are properties of the `requestData` object required by the `ApprovalController.add` method.
 */
export default {
  title: 'Pages/ConfirmationPage/AddEthereumChain',
  component: ConfirmationPage,
  argTypes: {
    redirectToHomeOnZeroConfirmations: {
      table: {
        disable: true,
      },
    },
    chainName: {
      control: 'text',
      description: 'The name of the network.',
    },
    chainId: {
      control: 'text',
      description: 'The hexadecimal chain ID of the network.',
    },
    rpcUrl: {
      control: 'text',
      description: 'The URL of the RPC endpoint for the network.',
    },
    ticker: {
      control: 'text',
      description: 'The ticker symbol for the network.',
    },
    blockExplorerUrl: {
      name: 'rpcPrefs.blockExplorerUrl',
      control: 'text',
      description: 'The URL of the block explorer for the network.',
    },
  },
  args: {
    chainName: 'Test Chain',
    chainId: '0x123',
    rpcUrl: 'https://test:com:8545',
    ticker: 'TST',
    blockExplorerUrl: 'https://test.com/explorer',
  },
};

export const DefaultStory = (args) => {
  const { blockExplorerUrl, ...finalArgs } = args;

  finalArgs.rpcPrefs = {
    blockExplorerUrl,
  };

  return (
    <PendingApproval
      type={ApprovalType.AddEthereumChain}
      requestData={finalArgs}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
