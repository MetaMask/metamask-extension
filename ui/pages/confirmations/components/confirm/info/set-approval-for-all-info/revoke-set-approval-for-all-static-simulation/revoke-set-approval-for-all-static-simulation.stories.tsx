import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockApproveConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { RevokeSetApprovalForAllStaticSimulation } from './revoke-set-approval-for-all-static-simulation';

const store = configureStore(getMockApproveConfirmState());

const Story = {
  title:
    'Pages/Confirmations/Components/Confirm/Info/SetApprovalForAllInfo/RevokeSetApprovalForAllStaticSimulation',
  component: RevokeSetApprovalForAllStaticSimulation,
  decorators: [
    (story: () => Meta<typeof RevokeSetApprovalForAllStaticSimulation>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = (args) => (
  <RevokeSetApprovalForAllStaticSimulation {...args} />
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  spender: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
};
