import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockApproveConfirmState } from '../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../context/confirm';
import SetApprovalForAll from './set-approval-for-all-info';

const store = configureStore(getMockApproveConfirmState());

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/SetApprovalForAllInfo',
  component: SetApprovalForAll,
  decorators: [
    (story: () => Meta<typeof SetApprovalForAll>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <SetApprovalForAll />;

DefaultStory.storyName = 'Default';
