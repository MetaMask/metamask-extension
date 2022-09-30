import React from 'react';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FeeCard from './fee-card';

const containerStyle = {
  width: '300px',
};

export default {
  title: 'Pages/Swaps/FeeCard',
  id: __filename,
  component: FeeCard,
  argTypes: {
    primaryFee: {
      control: {
        type: 'text',
      },
    },
    primaryMaxFee: {
      control: {
        type: 'text',
      },
    },
    secondaryFee: {
      control: {
        type: 'text',
      },
    },
    secondaryMaxFee: {
      control: {
        type: 'text',
      },
    },
    onFeeCardMaxRowClick: {
      action: 'Clicked max fee row edit link',
    },
    hideTokenApprovalRow: {
      control: {
        type: 'boolean',
      },
    },
    tokenApprovalSourceTokenSymbol: {
      control: {
        type: 'text',
      },
    },
    onTokenApprovalClick: {
      action: 'Clicked on token approval',
    },
    metaMaskFee: {
      control: {
        type: 'text',
      },
    },
    onQuotesClick: {
      action: 'Clicked on quotes link',
    },
    numberOfQuotes: {
      control: {
        type: 'number',
      },
    },
    chainId: {
      control: {
        type: 'text',
      },
    },
    smartTransactionsOptInStatus: {
      control: {
        type: 'boolean',
      },
    },
    smartTransactionsEnabled: {
      control: {
        type: 'boolean',
      },
    },
    isBestQuote: {
      control: {
        type: 'boolean',
      },
    },
    supportsEIP1559V2: {
      control: {
        type: 'boolean',
      },
    },
  },
  args: {
    primaryFee: '1 ETH',
    primaryMaxFee: '2 ETH',
    secondaryFee: '100 USD',
    secondaryMaxFee: '200 USD',
    hideTokenApprovalRow: false,
    tokenApprovalSourceTokenSymbol: 'ABC',
    metaMaskFee: '0.875',
    numberOfQuotes: 6,
    chainId: CHAIN_IDS.MAINNET,
    isBestQuote: true,
  },
};

export const DefaultStory = (args) => {
  // Please note, currently nested arg types are not possible, but discussions are open:
  // https://github.com/storybookjs/storybook/issues/11486
  const { primaryFee, primaryMaxFee, secondaryFee, secondaryMaxFee, ...rest } =
    args;

  return (
    <div style={containerStyle}>
      <FeeCard
        primaryFee={{
          fee: primaryFee,
          maxFee: primaryMaxFee,
        }}
        secondaryFee={{
          fee: secondaryFee,
          maxFee: secondaryMaxFee,
        }}
        {...rest}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
