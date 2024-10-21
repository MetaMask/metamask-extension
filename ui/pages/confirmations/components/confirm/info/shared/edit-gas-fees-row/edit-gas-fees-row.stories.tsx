import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { EditGasFeesRow } from './edit-gas-fees-row';

function getStore() {
  return configureStore(getMockContractInteractionConfirmState());
}

const Story = {
  title: 'Components/App/Confirm/info/EditGasFeesRow',
  component: EditGasFeesRow,
  decorators: [
    (story: () => Meta<typeof EditGasFeesRow>) => (
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
  <EditGasFeesRow
    fiatFee="$1"
    nativeFee="0.001 ETH"
    supportsEIP1559={true}
    setShowCustomizeGasPopover={() => {}}
  />
);

DefaultStory.storyName = 'Default';
