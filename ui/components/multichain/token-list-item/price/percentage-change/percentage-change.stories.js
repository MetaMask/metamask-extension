import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../../../.storybook/test-data';
import configureStore from '../../../../../store/store';
import { PercentageChange } from './percentage-change';

export default {
  title: 'Components/Multichain/TokenListItem/Price/PercentageChange',
  component: PercentageChange,
  argTypes: {
    value: {
      control: 'number',
    },
    color: {
      control: 'color',
    },
  },
  args: {
    value: 5.23,
    color: 'green',
  },
};

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    currentCurrency: 'USD',
    intlLocale: 'en-US',
  },
};
const customStore = configureStore(customData);

const Template = (args) => (
  <Provider store={customStore}>
    <PercentageChange {...args} />
  </Provider>
);

export const PositivePercentageChange = Template.bind({});
PositivePercentageChange.args = {
  value: 5.23,
  color: 'green',
};

export const NegativePercentageChange = Template.bind({});
NegativePercentageChange.args = {
  value: -2.47,
  color: 'red',
};
