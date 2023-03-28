import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

import README from './README.mdx';
import ConfirmSubTitle from './confirm-subtitle';

mockState.metamask.preferences.showFiatInTestnets = true;
const store = configureStore(mockState);

export default {
  title: 'Components/App/ConfirmSubTitle',

  component: ConfirmSubTitle,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    txData: 'object',
    hexTransactionAmount: 'number',
    title: 'string',
  },
  args: {
    txData: {
      txParams: {},
      type: 'transfer',
    },
    hexTransactionAmount: '0x9184e72a000',
    subtitleComponent: undefined,
  },
};

export const DefaultStory = (args) => {
  return <ConfirmSubTitle {...args} />;
};

DefaultStory.storyName = 'Default';

export const CustomSubTitleStory = (args) => {
  return <ConfirmSubTitle {...args} />;
};

CustomSubTitleStory.storyName = 'CustomSubTitle';
CustomSubTitleStory.args = {
  subtitleComponent: 'Any custom sub title passed',
};
