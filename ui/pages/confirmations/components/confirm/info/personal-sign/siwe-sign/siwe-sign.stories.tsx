import React from 'react';
import { Provider } from 'react-redux';

import { SignatureRequestSIWEWithResources } from '../../../../../../../../test/data/confirmations/personal_sign';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';

import SIWESignInfo from './siwe-sign';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: SignatureRequestSIWEWithResources,
  },
});

const Story = {
  title: 'Components/App/Confirm/info/SIWESignInfo',
  component: SIWESignInfo,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <SIWESignInfo />;

DefaultStory.storyName = 'Default';
