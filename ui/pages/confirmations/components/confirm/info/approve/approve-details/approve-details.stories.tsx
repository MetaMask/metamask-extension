import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockApproveConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ApproveDetails } from './approve-details';
import { ConfirmContextProvider } from '../../../../../context/confirm';

const store = configureStore(getMockApproveConfirmState());

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/Shared/ApproveDetails',
  component: ApproveDetails,
  decorators: [
    (story: () => Meta<typeof ApproveDetails>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <ApproveDetails />;

DefaultStory.storyName = 'Default';
