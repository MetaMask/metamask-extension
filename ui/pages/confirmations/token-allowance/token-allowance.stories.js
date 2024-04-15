import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import {
  BlockaidReason,
  BlockaidResultType,
  SECURITY_PROVIDER_MESSAGE_SEVERITY,
} from '../../../../shared/constants/security-provider';

import TokenAllowance from './token-allowance';

const defaultArgs = {
  origin: 'https://metamask.github.io',
  siteImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  useNonceField: false,
  currentCurrency: 'usd',
  nativeCurrency: 'GoerliETH',
  ethTransactionTotal: '0.0012',
  fiatTransactionTotal: '1.6',
  hexTransactionTotal: '0x44364c5bb0000',
  isMultiLayerFeeNetwork: false,
  supportsEIP1559: false,
  userAddress: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
  tokenAddress: '0x55797717b9947b31306f4aac7ad1365c6e3923bd',
  data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
  isSetApproveForAll: false,
  setApproveForAllArg: false,
  decimals: '4',
  dappProposedTokenAmount: '7',
  currentTokenBalance: '10',
  toAddress: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
  tokenSymbol: 'TST',
  fromAddressIsLedger: false,
  txData: {
    id: 3049568294499567,
    time: 1664449552289,
    status: 'unapproved',
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
      from: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
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
          from: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
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
};

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
      control: 'boolean',
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
    warning: {
      control: 'text',
    },
    fromAddressIsLedger: {
      control: 'boolean',
    },
  },
  args: {
    ...defaultArgs,
  },
};

const Template = (args) => <TokenAllowance {...args} />;

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';

const storeWithErrors = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    // TODO: Mock state correctly to show insufficient funds error
    //
    accounts: {
      ...testData.metamask.accounts,
      '0x9d0ba4ddac06032527b140912ec808ab9451b788': {
        balance: '0x0',
      },
    },
  },
  confirmTransaction: {
    txData: {
      // SimulationErrorMessage warning
      simulationFails: true,
    },
  },
});

export const AllBannerAlerts = Template.bind({});

AllBannerAlerts.decorators = [
  (story) => <Provider store={storeWithErrors}>{story()}</Provider>,
];

AllBannerAlerts.args = {
  ...defaultArgs,
  origin: 'https://portfolio.metamask.io',
  txData: {
    ...defaultArgs.txData,
    // SecurityProviderBannerMessage warning
    securityAlertResponse: {
      result_type: BlockaidResultType.Warning,
      reason: BlockaidReason.setApprovalForAll,
      description:
        'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
      args: {
        contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
        operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
      },
    },
    securityProviderResponse: {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.MALICIOUS,
      reason:
        'Approval is to an unverified smart contract known for stealing NFTs in the past.',
      reason_header: 'This could be a scam',
    },
  },
  // Non specific warning
  warning: 'This is a warning',
  // Sending from Ledger
  fromAddressIsLedger: true,
};

export const UseNonceField = Template.bind({});
UseNonceField.args = {
  ...defaultArgs,
  useNonceField: true,
};
