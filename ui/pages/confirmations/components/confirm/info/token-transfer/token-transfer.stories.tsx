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
import { DappSwapContextProvider } from '../../../../context/dapp-swap';
import { GasFeeModalContextProvider } from '../../../../context/gas-fee-modal';
import TokenTransferInfo from './token-transfer';

const store = configureStore(getMockTokenTransferConfirmState({}));

const Story = {
  title: 'Components/App/Confirm/info/TokenTransferInfo',
  component: TokenTransferInfo,
  decorators: [
    (story: () => any) => (
      <Provider store={store}>
        <ConfirmContextProvider>
          <DappSwapContextProvider>
            <GasFeeModalContextProvider>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
                flexDirection={FlexDirection.Column}
              >
                {story()}
              </Box>
            </GasFeeModalContextProvider>
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <TokenTransferInfo />;

DefaultStory.storyName = 'Default';
