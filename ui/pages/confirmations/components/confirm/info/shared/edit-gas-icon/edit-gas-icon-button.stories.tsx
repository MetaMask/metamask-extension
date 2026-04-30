import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';

import { getMockTokenTransferConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { GasFeeModalContextProvider } from '../../../../../context/gas-fee-modal';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { EditGasIconButton } from './edit-gas-icon-button';

const store = configureStore(getMockTokenTransferConfirmState({}));

const Story = {
  title: 'Components/App/Confirm/info/EditGasIconButton',
  component: EditGasIconButton,
  decorators: [
    (story: () => Meta<typeof EditGasIconButton>) => (
      <Provider store={store}>
        <ConfirmContextProvider>
          <GasFeeModalContextProvider>
            <div
              style={{
                backgroundColor: 'var(--color-background-alternative)',
                padding: 30,
              }}
            >
              {story()}
            </div>
          </GasFeeModalContextProvider>
        </ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <EditGasIconButton />;

DefaultStory.storyName = 'Default';
