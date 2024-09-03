import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { TransactionData } from './transaction-data';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import {
  CONTRACT_ADDRESS_FOUR_BYTE,
  CONTRACT_ADDRESS_SOURCIFY,
  CONTRACT_ADDRESS_UNISWAP,
} from '../../../../../../../../test/data/confirmations/transaction-decode';
import configureStore from '../../../../../../../store/store';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { TransactionMeta } from '@metamask/transaction-controller';

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

  return configureStore({
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        petnamesEnabled: true,
      },
    },
    confirm: {
      currentConfirmation: confirmation,
    },
  });
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
        <TransactionData />
      </div>
    </Provider>
  );
}

export default {
  title: 'Components/App/Confirm/Info/Shared/TransactionData',
  component: TransactionData,
  decorators: [(story: () => Meta<typeof TransactionData>) => story()],
};

export const UniswapStory = () =>
  Template({ to: CONTRACT_ADDRESS_UNISWAP });

UniswapStory.storyName = 'Uniswap';

export const SourcifyStory = () =>
  Template({ to: CONTRACT_ADDRESS_SOURCIFY });

SourcifyStory.storyName = 'Sourcify';

export const FourByteStory = () =>
  Template({ to: CONTRACT_ADDRESS_FOUR_BYTE });

FourByteStory.storyName = 'Four Byte';

export const RawStory = () =>
  Template({
    transactionData: DATA_RAW_MOCK,
  });

RawStory.storyName = 'Raw';
