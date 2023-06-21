import React from 'react';
import TokenAllowance from './token-allowance';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Pages/TokenAllowance',

  argTypes: {
    origin: {
      control: 'text',
    },
    siteImage: {
      control: 'text',
    },
    showCustomizeGasModal: {
      action: 'showCustomizeGasModal',
    },
    useNonceField: {
      control: 'boolean',
    },
    currentCurrency: {
      control: 'text',
    },
    nativeCurrency: {
      control: 'text',
    },
    ethTransactionTotal: {
      control: 'text',
    },
    fiatTransactionTotal: {
      control: 'text',
    },
    hexTransactionTotal: {
      control: 'text',
    },
    isMultiLayerFeeNetwork: {
      control: 'text',
    },
    supportsEIP1559: {
      control: 'boolean',
    },
    userAddress: {
      control: 'text',
    },
    tokenAddress: {
      control: 'text',
    },
    data: {
      control: 'text',
    },
    isSetApproveForAll: {
      control: 'boolean',
    },
    setApproveForAllArg: {
      control: 'boolean',
    },
    decimals: {
      control: 'text',
    },
    dappProposedTokenAmount: {
      control: 'text',
    },
    currentTokenBalance: {
      control: 'text',
    },
    toAddress: {
      control: 'text',
    },
    tokenSymbol: {
      control: 'text',
    },
    txData: {
      control: 'object',
    },
  },
  args: {
    origin: 'https://metamask.github.io',
    siteImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
    useNonceField: false,
    currentCurrency: 'usd',
    nativeCurrency: 'RopstenETH',
    ethTransactionTotal: '0.0012',
    fiatTransactionTotal: '1.6',
    hexTransactionTotal: '0x44364c5bb0000',
    isMultiLayerFeeNetwork: false,
    supportsEIP1559: false,
    userAddress: '0xdd34b35ca1de17dfcdc07f79ff1f8f94868c40a1',
    tokenAddress: '0x55797717b9947b31306f4aac7ad1365c6e3923bd',
    data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
    isSetApproveForAll: false,
    setApproveForAllArg: false,
    decimals: '4',
    dappProposedTokenAmount: '7',
    currentTokenBalance: '10',
    toAddress: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
    tokenSymbol: 'TST',
    txData: {
      id: 3049568294499567,
      time: 1664449552289,
      status: 'unapproved',
      metamaskNetworkId: '3',
      originalGasEstimate: '0xea60',
      userEditedGasLimit: false,
      chainId: '0x3',
      loadingDefaults: false,
      dappSuggestedGasFees: {
        gasPrice: '0x4a817c800',
        gas: '0xea60',
      },
      sendFlowHistory: [],
      txParams: {
        from: '0xdd34b35ca1de17dfcdc07f79ff1f8f94868c40a1',
        to: '0x55797717b9947b31306f4aac7ad1365c6e3923bd',
        value: '0x0',
        data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
        gas: '0xea60',
        maxFeePerGas: '0x4a817c800',
        maxPriorityFeePerGas: '0x4a817c800',
      },
      origin: 'https://metamask.github.io',
      type: 'approve',
      history: [
        {
          id: 3049568294499567,
          time: 1664449552289,
          status: 'unapproved',
          metamaskNetworkId: '3',
          originalGasEstimate: '0xea60',
          userEditedGasLimit: false,
          chainId: '0x3',
          loadingDefaults: true,
          dappSuggestedGasFees: {
            gasPrice: '0x4a817c800',
            gas: '0xea60',
          },
          sendFlowHistory: [],
          txParams: {
            from: '0xdd34b35ca1de17dfcdc07f79ff1f8f94868c40a1',
            to: '0x55797717b9947b31306f4aac7ad1365c6e3923bd',
            value: '0x0',
            data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
            gas: '0xea60',
            gasPrice: '0x4a817c800',
          },
          origin: 'https://metamask.github.io',
          type: 'approve',
        },
        [
          {
            op: 'remove',
            path: '/txParams/gasPrice',
            note: 'Added new unapproved transaction.',
            timestamp: 1664449553939,
          },
          {
            op: 'add',
            path: '/txParams/maxFeePerGas',
            value: '0x4a817c800',
          },
          {
            op: 'add',
            path: '/txParams/maxPriorityFeePerGas',
            value: '0x4a817c800',
          },
          {
            op: 'replace',
            path: '/loadingDefaults',
            value: false,
          },
          {
            op: 'add',
            path: '/userFeeLevel',
            value: 'custom',
          },
          {
            op: 'add',
            path: '/defaultGasEstimates',
            value: {
              estimateType: 'custom',
              gas: '0xea60',
              maxFeePerGas: '0x4a817c800',
              maxPriorityFeePerGas: '0x4a817c800',
            },
          },
        ],
      ],
      userFeeLevel: 'custom',
      defaultGasEstimates: {
        estimateType: 'custom',
        gas: '0xea60',
        maxFeePerGas: '0x4a817c800',
        maxPriorityFeePerGas: '0x4a817c800',
      },
    },
  },
};

export const DefaultStory = (args) => {
  return <TokenAllowance {...args} />;
};

DefaultStory.storyName = 'Default';
