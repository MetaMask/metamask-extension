import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { GasFeesRow } from './gas-fees-row';

function getStore() {
  return configureStore(mockState);
}

const Story = {
  title: 'Components/App/Confirm/info/GasFeesRow',
  component: GasFeesRow,
  decorators: [
    (story: () => Meta<typeof GasFeesRow>) => (
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
  <GasFeesRow
    label="Some kind of fee"
    tooltipText="Tooltip text"
    fiatFee="$1"
    nativeFee="0.0001 ETH"
  />
);

DefaultStory.storyName = 'Default';
