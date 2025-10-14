import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';

import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { GasFeesRow } from './gas-fees-row';

function getStore() {
  return configureStore(getMockContractInteractionConfirmState());
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
          <ConfirmContextProvider>{story()}</ConfirmContextProvider>
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
    fiatFeeWith18SignificantDigits="0.001234"
    nativeFee="0.0001 ETH"
  />
);

DefaultStory.storyName = 'Default';
