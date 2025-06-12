import React from 'react';
import { Provider } from 'react-redux';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { Box } from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../../helpers/constants/design-system';
import configureStore from '../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../context/confirm';
import NFTTokenTransferInfo from './nft-token-transfer';

const store = configureStore(getMockTokenTransferConfirmState({}));

const Story = {
  title: 'Components/App/Confirm/info/NFTTransferInfo',
  component: NFTTokenTransferInfo,
  decorators: [
    (story: () => any) => (
      <Provider store={store}>
        <ConfirmContextProvider>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            flexDirection={FlexDirection.Column}
          >
            {story()}
          </Box>
        </ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <NFTTokenTransferInfo />;

DefaultStory.storyName = 'Default';
