import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockTokenTransferConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import NFTSendHeading from './nft-send-heading';

const store = configureStore(getMockTokenTransferConfirmState({}));

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/Shared/NFTSendHeading',
  component: NFTSendHeading,
  decorators: [
    (story: () => Meta<typeof NFTSendHeading>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => (
  <ConfirmContextProvider>
    <NFTSendHeading />
  </ConfirmContextProvider>
);

DefaultStory.storyName = 'Default';
