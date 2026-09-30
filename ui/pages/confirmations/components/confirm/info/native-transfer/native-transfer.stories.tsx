import React from 'react';
import { Provider } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
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
import NativeTransferInfo from './native-transfer';

const store = configureStore(
  getMockConfirmStateForTransaction({
    ...genUnapprovedContractInteractionConfirmation({
      chainId: '0x5',
      txData: '0x',
    }),
    type: TransactionType.simpleSend,
  }),
);

const Story = {
  title: 'Components/App/Confirm/info/NativeTransferInfo',
  component: NativeTransferInfo,
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

export const DefaultStory = () => <NativeTransferInfo />;

DefaultStory.storyName = 'Default';
