import React from 'react';
import { ERC20 } from '../../../../shared/constants/transaction';
import ConfirmApproveContent from '.';

export default {
  title: 'Pages/ConfirmApprove/ConfirmApproveContent',

  component: ConfirmApproveContent,
  argTypes: {
    decimals: {
      control: 'number',
    },
    tokenAmount: {
      control: 'text',
    },
    customTokenAmount: {
      control: 'text',
    },
    tokenSymbol: {
      control: 'text',
    },
    siteImage: {
      control: 'text',
    },
    showCustomizeGasModal: {
      action: 'showCustomizeGasModal',
    },
    showEditApprovalPermissionModal: {
      action: 'showEditApprovalPermissionModal',
    },
    origin: {
      control: 'text',
    },
    setCustomAmount: {
      action: 'setCustomAmount',
    },
    tokenBalance: {
      control: 'text',
    },
    data: {
      control: 'text',
    },
    toAddress: {
      control: 'text',
    },
    currentCurrency: {
      control: 'text',
    },
    nativeCurrency: {
      control: 'text',
    },
    fiatTransactionTotal: {
      control: 'text',
    },
    ethTransactionTotal: {
      control: 'text',
    },
    useNonceField: {
      control: 'boolean',
    },
    customNonceValue: {
      control: 'text',
    },
    updateCustomNonce: {
      action: 'updateCustomNonce',
    },
    getNextNonce: {
      action: 'getNextNonce',
    },
    nextNonce: {
      control: 'number',
    },
    showCustomizeNonceModal: {
      action: 'showCustomizeNonceModal',
    },
    warning: {
      control: 'text',
    },
    txData: {
      control: 'object',
    },
    fromAddressIsLedger: {
      control: 'boolean',
    },
    chainId: {
      control: 'text',
    },
    rpcPrefs: {
      control: 'object',
    },
    isContract: {
      control: 'boolean',
    },
    hexTransactionTotal: {
      control: 'text',
    },
    isMultiLayerFeeNetwork: {
      control: 'boolean',
    },
    supportsEIP1559: {
      control: 'boolean',
    },
    assetName: {
      control: 'text',
    },
    tokenId: {
      control: 'text',
    },
    assetStandard: {
      control: 'text',
    },
  },
  args: {
    decimals: 16,
    siteImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
    customTokenAmount: '10',
    tokenAmount: '10',
    origin: 'https://metamask.github.io/test-dapp/',
    tokenSymbol: 'TST',
    assetStandard: ERC20,
    tokenImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
    tokenBalance: '15',
    data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
    toAddress: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
    currentCurrency: 'TST',
    nativeCurrency: 'ETH',
    ethTransactionTotal: '20',
    fiatTransactionTotal: '10',
    useNonceField: true,
    nextNonce: 1,
    customNonceValue: '2',
    chainId: '1337',
    rpcPrefs: {},
    isContract: true,
  },
};

export const DefaultStory = (args) => <ConfirmApproveContent {...args} />;

DefaultStory.storyName = 'Default';
