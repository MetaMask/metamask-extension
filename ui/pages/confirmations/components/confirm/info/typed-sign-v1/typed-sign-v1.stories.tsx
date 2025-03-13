import React from 'react';
import { Provider } from 'react-redux';

import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../context/confirm';

import TypedSignInfoV1 from './typed-sign-v1';

const store = configureStore(
  getMockTypedSignConfirmStateForRequest(unapprovedTypedSignMsgV1),
);

const Story = {
  title: 'Components/App/Confirm/Info/TypedSignInfoV1',
  component: TypedSignInfoV1,
  decorators: [
    (story: () => any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <TypedSignInfoV1 />;

DefaultStory.storyName = 'Default';
