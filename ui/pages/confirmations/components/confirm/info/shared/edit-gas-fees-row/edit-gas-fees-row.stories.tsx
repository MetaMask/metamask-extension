import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { EditGasFeesRow } from './edit-gas-fees-row';

function getStore() {
  return configureStore({
    ...mockState,
    metamask: { ...mockState.metamask },
    confirm: {
      currentConfirmation: genUnapprovedContractInteractionConfirmation(),
    },
  });
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
          {story()}
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
