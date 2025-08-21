import React from 'react';
import { Meta } from '@storybook/react';
import { Provider } from 'react-redux';

import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { NetworkRow } from './network-row';

function getStore() {
  return configureStore(getMockContractInteractionConfirmState());
}

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/Shared/NetworkRow',
  component: NetworkRow,
  decorators: [
    (story: () => Meta<typeof NetworkRow>) => (
      <Provider store={getStore()}>
        <div
          style={{
            backgroundColor: 'var(--color-background-alternative)',
            padding: 30,
          }}
        >
          <ConfirmContextProvider>{story()}</ConfirmContextProvider>
        </div>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <NetworkRow />;

DefaultStory.storyName = 'Default';
