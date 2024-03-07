import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import { ConfirmInfoRow, ConfirmInfoRowVariant } from './row';
import { ConfirmInfoRowCurrency } from './currency';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      useNativeCurrencyAsPrimaryCurrency: false,
    },
  },
});

const ConfirmInfoRowCurrencyStory = {
  title: 'Components/App/Confirm/InfoRowCurrency',
  component: ConfirmInfoRowCurrency,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowVariant),
    },
    label: {
      control: 'text',
    },
  },
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>]
};

export const DefaultStory = ({ variant, value }) => (
  <ConfirmInfoRow label="Amount" variant={variant}>
    <ConfirmInfoRowCurrency value={value} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  value: 0xbefe6f672000,
};

export const FiatCurrencyStory = ({ variant, value }) => (
  <ConfirmInfoRow label="Amount" variant={variant}>
    <ConfirmInfoRowCurrency currency="usd" value={value} />
  </ConfirmInfoRow>
);

FiatCurrencyStory.storyName = 'FiatCurrency';

FiatCurrencyStory.args = {
  value: 0xaa731ed62d5eb,
};

export default ConfirmInfoRowCurrencyStory;
