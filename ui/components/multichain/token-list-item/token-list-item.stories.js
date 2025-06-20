import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
} from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { TokenListItem } from '.';

export default {
  title: 'Components/Multichain/MultichainTokenListItem',
  component: TokenListItem,
  argTypes: {
    tokenSymbol: {
      control: 'text',
    },
    tokenImage: {
      control: 'text',
    },
    primary: {
      control: 'text',
    },
    secondary: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
  },
  args: {
    secondary: '$9.80 USD',
    primary: '88.0068',
    tokenImage: './images/eth_logo.svg',
    tokenSymbol: CURRENCY_SYMBOLS.ETH,
    title: 'Ethereum',
    isOriginalTokenSymbol: true,
  },
};

const customNetworkData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
  },
};
const customNetworkStore = configureStore(customNetworkData);

const Template = (args) => {
  return <TokenListItem {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];
DefaultStory.args = {
  isStakeable: true,
};

export const ChaosStory = (args) => (
  <div
    style={{ width: '336px', border: '1px solid var(--color-border-muted)' }}
  >
    <TokenListItem {...args} />
  </div>
);
ChaosStory.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];

ChaosStory.args = {
  title: 'Really long, long name',
  secondary: '$94556756776.80 USD',
  primary: '34449765768526.00',
};

export const NoImagesStory = Template.bind({});

NoImagesStory.args = {
  tokenImage: '',
};

export const CrossChainTokenStory = (args) => (
  <div
    style={{ width: '336px', border: '1px solid var(--color-border-muted)' }}
  >
    <TokenListItem {...args} />
  </div>
);
CrossChainTokenStory.decorators = [
  (Story) => (
    <Provider
      store={configureStore({
        metamask: {
          ...testData.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      })}
    >
      <Story />
    </Provider>
  ),
];

CrossChainTokenStory.args = {
  title: 'USDC',
  secondary: '$94556756776.80 USD',
  primary: '34449765768526.00',
  isTitleNetworkName: true,
  chainId: CHAIN_IDS.LINEA_SEPOLIA,
};
