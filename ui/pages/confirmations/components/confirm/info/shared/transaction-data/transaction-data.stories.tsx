import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import {
  CONTRACT_ADDRESS_FOUR_BYTE,
  CONTRACT_ADDRESS_SOURCIFY,
  CONTRACT_ADDRESS_UNISWAP,
} from '../../../../../../../../test/data/confirmations/transaction-decode';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { Confirmation } from '../../../../../types/confirm';
import { TransactionData } from './transaction-data';
import { ConfirmContextProvider } from '../../../../../context/confirm';

const DATA_RAW_MOCK =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

function getStore(transactionData?: string, to?: string) {
  const confirmationTemplate =
    genUnapprovedContractInteractionConfirmation() as TransactionMeta;

  const confirmation = {
    ...confirmationTemplate,
    chainId: '0x1',
    txParams: {
      ...confirmationTemplate.txParams,
      to: to ?? confirmationTemplate.txParams.to,
      data: transactionData ?? confirmationTemplate.txParams.data,
    },
  };

  return configureStore(
    getMockConfirmStateForTransaction(confirmation as Confirmation, {
      metamask: {
        preferences: {
          petnamesEnabled: true,
        },
      },
    }),
  );
}

function Template({
  transactionData,
  to,
}: {
  transactionData?: string;
  to?: string;
}) {
  return (
    <Provider store={getStore(transactionData, to)}>
      <div
        style={{
          backgroundColor: 'var(--color-background-alternative)',
          padding: 30,
        }}
      >
        <ConfirmContextProvider>
          <TransactionData />
        </ConfirmContextProvider>
      </div>
    </Provider>
  );
}

export default {
  title: 'Components/App/Confirm/Info/Shared/TransactionData',
  component: TransactionData,
  decorators: [(story: () => Meta<typeof TransactionData>) => story()],
};

export const UniswapStory = () => Template({ to: CONTRACT_ADDRESS_UNISWAP });

UniswapStory.storyName = 'Uniswap';

export const SourcifyStory = () => Template({ to: CONTRACT_ADDRESS_SOURCIFY });

SourcifyStory.storyName = 'Sourcify';

export const FourByteStory = () => Template({ to: CONTRACT_ADDRESS_FOUR_BYTE });

FourByteStory.storyName = 'Four Byte';

export const RawStory = () =>
  Template({
    transactionData: DATA_RAW_MOCK,
  });

RawStory.storyName = 'Raw';
