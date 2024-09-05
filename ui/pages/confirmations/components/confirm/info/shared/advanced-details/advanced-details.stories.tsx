import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { AdvancedDetails } from './advanced-details';

const store = configureStore(getMockContractInteractionConfirmState());

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/Shared/AdvancedDetails',
  component: AdvancedDetails,
  decorators: [
    (story: () => Meta<typeof AdvancedDetails>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <AdvancedDetails />;

DefaultStory.storyName = 'Default';
