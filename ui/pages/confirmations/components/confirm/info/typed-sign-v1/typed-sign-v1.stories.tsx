import React from 'react';
import { Provider } from 'react-redux';

import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';

import mockState from '../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../store/store';

import TypedSignInfoV1 from './typed-sign-v1';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: unapprovedTypedSignMsgV1,
  },
});

const Story = {
  title: 'Components/App/Confirm/info/TypedSignInfoV1',
  component: TypedSignInfoV1,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <TypedSignInfoV1 />;

DefaultStory.storyName = 'Default';
