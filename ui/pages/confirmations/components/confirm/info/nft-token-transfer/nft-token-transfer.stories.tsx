import React from 'react';
import { Provider } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedTokenTransferConfirmation,
  TRANSFER_FROM_TRANSACTION_DATA,
} from '../../../../../../../test/data/confirmations/token-transfer';
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
import NFTTokenTransferInfo from './nft-token-transfer';

const nftTransferConfirmation = genUnapprovedTokenTransferConfirmation({});

const store = configureStore(
  getMockConfirmStateForTransaction({
    ...nftTransferConfirmation,
    type: TransactionType.tokenMethodTransferFrom,
    txParams: {
      ...nftTransferConfirmation.txParams,
      data: TRANSFER_FROM_TRANSACTION_DATA,
      value: '0x0',
    },
  }),
);

const Story = {
  title: 'Components/App/Confirm/info/NFTTransferInfo',
  component: NFTTokenTransferInfo,
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

export const DefaultStory = () => <NFTTokenTransferInfo />;

DefaultStory.storyName = 'Default';
