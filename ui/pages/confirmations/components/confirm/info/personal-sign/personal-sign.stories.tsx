import React from 'react';
import { Provider } from 'react-redux';

import { unapprovedPersonalSignMsg } from '../../../../../../../test/data/confirmations/personal_sign';

import mockState from '../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../store/store';

import PersonalSignInfo from './personal-sign';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: unapprovedPersonalSignMsg,
  },
});

const Story = {
  title: 'Components/App/Confirm/info/PersonalSignInfo',
  component: PersonalSignInfo,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <PersonalSignInfo />;

DefaultStory.storyName = 'Default';
