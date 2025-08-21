import React from 'react';
import { Provider } from 'react-redux';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';

import { SimulationSettingsModal } from './simulation-settings-modal';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';

const store = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({}),
    {
      metamask: {},
    },
  ),
);

const Story = {
  title: 'Pages/Confirmations/Components/Modals/SimulationSettingsModal',
  component: SimulationSettingsModal,
  decorators: [
    (story: any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => (
  <SimulationSettingsModal onClose={() => {}} />
);

DefaultStory.storyName = 'Default';
