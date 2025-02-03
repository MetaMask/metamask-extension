import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../../../store/store';
import { getMockPersonalSignConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { ConfirmContextProvider } from '../../../../context/confirm';

import PersonalSignInfo from './personal-sign';

const store = configureStore(getMockPersonalSignConfirmState());

const Story = {
  title: 'Components/App/Confirm/info/PersonalSignInfo',
  component: PersonalSignInfo,
  decorators: [
    (story: () => any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <PersonalSignInfo />;

DefaultStory.storyName = 'Default';
