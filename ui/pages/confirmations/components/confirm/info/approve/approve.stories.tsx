import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../store/store';
import ApproveInfo from './approve';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: genUnapprovedContractInteractionConfirmation(),
  },
});

const Story = {
  title: 'Components/App/Confirm/info/ApproveInfo',
  component: ApproveInfo,
  decorators: [
    (story: () => Meta<typeof ApproveInfo>) => (
      <Provider store={store}>{story()}</Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <ApproveInfo />;

DefaultStory.storyName = 'Default';