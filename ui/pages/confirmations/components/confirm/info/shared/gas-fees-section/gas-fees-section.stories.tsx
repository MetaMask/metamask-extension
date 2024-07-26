import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { GasFeesSection } from './gas-fees-section';

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
  title: 'Components/App/Confirm/info/GasFeesSection',
  component: GasFeesSection,
  decorators: [
    (story: () => Meta<typeof GasFeesSection>) => (
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

export const DefaultStory = () => <GasFeesSection />;

DefaultStory.storyName = 'Default';
