import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';

import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { GasFeesDetails } from './gas-fees-details';

function getStore() {
  return configureStore(getMockContractInteractionConfirmState());
}

const Story = {
  title: 'Components/App/Confirm/info/GasFeesDetails',
  component: GasFeesDetails,
  decorators: [
    (story: () => Meta<typeof GasFeesDetails>) => (
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

export const DefaultStory = () => (
  <GasFeesDetails setShowCustomizeGasPopover={() => {}} />
);

DefaultStory.storyName = 'Default';
