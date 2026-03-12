import React from 'react';
import { Provider } from 'react-redux';

import { getMockTypedSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../store/store';

import { ConfirmContextProvider } from '../../../context/confirm';
import Header from './header';

const store = configureStore(getMockTypedSignConfirmState());

const Story = {
  title: 'Confirmations/Components/Confirm/Header',
  component: Header,
  decorators: [
    (story: any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <Header />;

DefaultStory.storyName = 'Default';
