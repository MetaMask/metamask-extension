import React from 'react';
import { Provider } from 'react-redux';

import { unapprovedTypedSignMsgV4 } from '../../../../../../../test/data/confirmations/typed_sign';

import mockState from '../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../store/store';

import TypedSignInfo from './typed-sign';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: unapprovedTypedSignMsgV4,
  },
});

const Story = {
  title: 'Components/App/Confirm/info/TypedSignInfo',
  component: TypedSignInfo,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <TypedSignInfo />;

DefaultStory.storyName = 'Default';
