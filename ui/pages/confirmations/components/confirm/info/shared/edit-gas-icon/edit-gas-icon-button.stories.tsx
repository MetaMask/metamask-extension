import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { EditGasIconButton } from './edit-gas-icon-button';

function getStore() {
  return configureStore(mockState);
}

const Story = {
  title: 'Components/App/Confirm/info/EditGasIconButton',
  component: EditGasIconButton,
  decorators: [
    (story: () => Meta<typeof EditGasIconButton>) => (
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
  <EditGasIconButton
    supportsEIP1559={true}
    setShowCustomizeGasPopover={() => {}}
  />
);

DefaultStory.storyName = 'Default';
