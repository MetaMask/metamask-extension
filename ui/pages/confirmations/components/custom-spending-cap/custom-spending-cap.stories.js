import React from 'react';
import { useArgs } from '@storybook/client-api';

import CustomSpendingCap from './custom-spending-cap';

export default {
  title: 'Confirmations/Components/CustomSpendingCap',
  argTypes: {
    txParams: {
      control: 'object',
    },
    tokenName: {
      control: 'text',
    },
    currentTokenBalance: {
      control: 'text',
    },
    dappProposedValue: {
      control: 'text',
    },
    siteOrigin: {
      control: 'text',
    },
    passTheErrorText: {
      action: 'passTheErrorText',
    },
    decimals: {
      control: 'text',
    },
    setInputChangeInProgress: {
      action: 'setInputChangeInProgress',
    },
    customSpendingCap: {
      control: 'text',
    },
    setCustomSpendingCap: {
      action: 'setCustomSpendingCap',
    },
  },
  args: {
    tokenName: 'DAI',
    currentTokenBalance: '200.12',
    dappProposedValue: '7',
    siteOrigin: 'Uniswap.org',
    decimals: '4',
    customSpendingCap: '7',
    txParams: {
      data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      gas: '0xb41b',
      maxFeePerGas: '0x4a817c800',
      maxPriorityFeePerGas: '0x4a817c800',
      to: '0x665933d73375e385bef40abcccea8b4cccc32d4c',
      value: '0x0',
    },
  },
};

const Template = (args) => {
  const [{ customSpendingCap }, updateArgs] = useArgs();
  const handleOnChange = (value) => {
    updateArgs({ customSpendingCap: value });
  };
  return (
    <CustomSpendingCap
      {...args}
      customSpendingCap={customSpendingCap}
      setCustomSpendingCap={handleOnChange}
    />
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const CustomSpendingCapStory = Template.bind({});
CustomSpendingCapStory.storyName = 'CustomSpendingCap';

CustomSpendingCapStory.args = {
  customSpendingCap: '8',
};
