import React from 'react';
import ApproveContentCard from './approve-content-card';

export default {
  title: 'Components/App/ApproveContentCard',

  argTypes: {
    showHeader: {
      control: 'boolean',
    },
    symbol: {
      control: 'array',
    },
    title: {
      control: 'text',
    },
    showEdit: {
      control: 'boolean',
    },
    showAdvanceGasFeeOptions: {
      control: 'boolean',
    },
    footer: {
      control: 'array',
    },
    noBorder: {
      control: 'boolean',
    },
    supportsEIP1559: {
      control: 'boolean',
    },
    renderTransactionDetailsContent: {
      control: 'boolean',
    },
    renderDataContent: {
      control: 'boolean',
    },
    isMultiLayerFeeNetwork: {
      control: 'boolean',
    },
    ethTransactionTotal: {
      control: 'text',
    },
    nativeCurrency: {
      control: 'text',
    },
    fullTxData: {
      control: 'object',
    },
    hexTransactionTotal: {
      control: 'text',
    },
    fiatTransactionTotal: {
      control: 'text',
    },
    currentCurrency: {
      control: 'text',
    },
    isSetApproveForAll: {
      control: 'boolean',
    },
    isApprovalOrRejection: {
      control: 'boolean',
    },
    data: {
      control: 'text',
    },
    onEditClick: {
      control: 'onEditClick',
    },
  },
  args: {
    showHeader: true,
    symbol: <i className="fa fa-tag" />,
    title: 'Transaction fee',
    showEdit: true,
    showAdvanceGasFeeOptions: true,
    noBorder: true,
    supportsEIP1559: false,
    renderTransactionDetailsContent: true,
    renderDataContent: false,
    isMultiLayerFeeNetwork: false,
    ethTransactionTotal: '0.0012',
    nativeCurrency: 'GoerliETH',
    hexTransactionTotal: '0x44364c5bb0000',
    fiatTransactionTotal: '1.54',
    currentCurrency: 'usd',
    isSetApproveForAll: false,
    isApprovalOrRejection: false,
    data: '',
    fullTxData: {
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
  return <ApproveContentCard {...args} />;
};

DefaultStory.storyName = 'Default';
