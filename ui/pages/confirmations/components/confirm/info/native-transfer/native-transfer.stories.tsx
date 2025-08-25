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
import NativeTransferInfo from './native-transfer';

const store = configureStore(getMockTokenTransferConfirmState({}));

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/NativeTransfer',
  component: NativeTransferInfo,
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

export const DefaultStory = () => <NativeTransferInfo />;

DefaultStory.storyName = 'Default';
