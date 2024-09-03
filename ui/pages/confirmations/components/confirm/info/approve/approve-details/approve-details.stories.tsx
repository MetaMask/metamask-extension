import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import {
  DEPOSIT_METHOD_DATA,
  genUnapprovedApproveConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { ApproveDetails } from './approve-details';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    use4ByteResolution: true,
    knownMethodData: {
      [DEPOSIT_METHOD_DATA]: {
        name: 'Deposit',
        params: [],
      },
    },
  },
  confirm: {
    currentConfirmation: genUnapprovedApproveConfirmation(),
  },
});

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/Shared/ApproveDetails',
  component: ApproveDetails,
  decorators: [
    (story: () => Meta<typeof ApproveDetails>) => (
      <Provider store={store}>{story()}</Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <ApproveDetails />;

DefaultStory.storyName = 'Default';
