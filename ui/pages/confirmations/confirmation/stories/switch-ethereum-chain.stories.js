import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

/**
 * A confirmation to switch the current network in the wallet.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.add` method with the `type` set to `wallet_switchEthereumChain`.<br/><br/>
 * The below arguments are properties of the `requestData` object required by the `ApprovalController.add` method.
 */
export default {
  title: 'Pages/ConfirmationPage/SwitchEthereumChain',
  component: ConfirmationPage,
  argTypes: {
    redirectToHomeOnZeroConfirmations: {
      table: {
        disable: true,
      },
    },
    fromNetworkConfigurationNickname: {
      name: 'fromNetworkConfiguration.nickname',
      control: 'text',
      description: 'The name of the current network.',
    },
    fromNetworkConfigurationChainId: {
      name: 'fromNetworkConfiguration.chainId',
      control: 'text',
      description: 'The hexadecimal chain ID of the current network.',
    },
    fromNetworkConfigurationIconURL: {
      name: 'fromNetworkConfiguration.iconUrl',
      control: 'text',
      description: 'The URL of the icon for the current network.',
    },
    toNetworkConfigurationNickname: {
      name: 'toNetworkConfiguration.nickname',
      control: 'text',
      description: 'The name of the new network.',
    },
    toNetworkConfigurationChainId: {
      name: 'toNetworkConfiguration.chainId',
      control: 'text',
      description: 'The hexadecimal chain ID of the new network.',
    },
    toNetworkConfigurationIconURL: {
      name: 'toNetworkConfiguration.iconUrl',
      control: 'text',
      description: 'The URL of the icon for the new network.',
    },
  },
  args: {
    fromNetworkConfigurationNickname: 'Test Network 1',
    fromNetworkConfigurationChainId: '0x123',
    fromNetworkConfigurationIconURL: './images/eth_logo.svg',
    toNetworkConfigurationNickname: 'Test Network 2',
    toNetworkConfigurationChainId: '0x456',
    toNetworkConfigurationIconURL: './images/bnb.png',
  },
};

export const DefaultStory = (args) => {
  const finalArgs = {
    fromNetworkConfiguration: {
      nickname: args.fromNetworkConfigurationNickname,
      chainId: args.fromNetworkConfigurationChainId,
      iconUrl: args.fromNetworkConfigurationIconURL,
    },
    toNetworkConfiguration: {
      nickname: args.toNetworkConfigurationNickname,
      chainId: args.toNetworkConfigurationChainId,
      iconUrl: args.toNetworkConfigurationIconURL,
    },
  };

  return (
    <PendingApproval
      type={ApprovalType.SwitchEthereumChain}
      requestData={finalArgs}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
