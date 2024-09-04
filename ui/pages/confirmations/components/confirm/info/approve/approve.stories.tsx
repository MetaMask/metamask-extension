import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockApproveConfirmState } from '../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../context/confirm';
import ApproveInfo from './approve';

const store = configureStore(getMockApproveConfirmState());

const Story = {
  title: 'Components/App/Confirm/info/ApproveInfo',
  component: ApproveInfo,
  decorators: [
    (story: () => Meta<typeof ApproveInfo>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <ApproveInfo />;

DefaultStory.storyName = 'Default';
