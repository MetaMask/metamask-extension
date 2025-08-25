import React from 'react';
import { Provider } from 'react-redux';

import { getMockTypedSignConfirmState } from '../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../context/confirm';

import TypedSignInfo from './typed-sign';

const store = configureStore(getMockTypedSignConfirmState());

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/TypedSign',
  component: TypedSignInfo,
  decorators: [
    (story: () => any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <TypedSignInfo />;

DefaultStory.storyName = 'Default';
