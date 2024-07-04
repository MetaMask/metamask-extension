import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { GasFeesDetails } from './gas-fees-details';

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
          {story()}
        </div>
      </Provider>
    ),
  ],
  argTypes: {
    showAdvancedDetails: {
      control: 'select',
      options: [false, true],
    },
  },
  args: {
    showAdvancedDetails: false,
  },
};

export default Story;

export const DefaultStory = (args) => (
  <GasFeesDetails
    setShowCustomizeGasPopover={() => {}}
    showAdvancedDetails={args.showAdvancedDetails}
  />
);

DefaultStory.storyName = 'Default';
