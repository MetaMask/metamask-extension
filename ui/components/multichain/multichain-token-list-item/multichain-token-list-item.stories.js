import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { MultichainTokenListItem } from './multichain-token-list-item';

export default {
  title: 'Components/Multichain/MultichainTokenListItem',
  component: MultichainTokenListItem,
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
    primary: '88.00687889',
    tokenImage: './images/eth_logo.png',
    tokenSymbol: 'ETH',
    title: 'Ethereum',
  },
};

const customNetworkData = {
  ...testData,
  metamask: { ...testData.metamask, nativeCurrency: '' },
};
const customNetworkStore = configureStore(customNetworkData);

const Template = (args) => {
  return <MultichainTokenListItem {...args} />;
};

export const DefaultStory = Template.bind({});

export const ChaosStory = (args) => (
  <div
    style={{ width: '336px', border: '1px solid var(--color-border-muted)' }}
  >
    <MultichainTokenListItem {...args} />
  </div>
);
ChaosStory.storyName = 'ChaosStory';

ChaosStory.args = {
  title: 'Really long, long name',
  secondary: '$94556756776.80 USD',
  primary: '34449765768526.00',
};

export const NoImagesStory = Template.bind({});

NoImagesStory.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];

NoImagesStory.args = {
  tokenImage: '',
};
