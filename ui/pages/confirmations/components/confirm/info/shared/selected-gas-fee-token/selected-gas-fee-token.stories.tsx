import React from 'react';
import { Provider } from 'react-redux';

import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';

import { SelectedGasFeeToken } from './selected-gas-fee-token';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { toHex } from '@metamask/controller-utils';
import { CHAIN_IDS, GasFeeToken } from '@metamask/transaction-controller';
import { mockNetworkState } from '../../../../../../../../test/stub/networks';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567891',
  symbol: 'USDC',
  tokenAddress: '0x1234567890123456789012345678901234567890',
};

function getStore({
  gasFeeTokens,
  noSelectedGasFeeToken,
}: { gasFeeTokens?: GasFeeToken[]; noSelectedGasFeeToken?: boolean } = {}) {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        chainId: CHAIN_IDS.MAINNET,
        gasFeeTokens: gasFeeTokens ?? [GAS_FEE_TOKEN_MOCK],
        selectedGasFeeToken: noSelectedGasFeeToken
          ? undefined
          : GAS_FEE_TOKEN_MOCK.tokenAddress,
      }),
      {
        metamask: {
          preferences: {
            showFiatInTestnets: true,
          },
          smartTransactionsFeatureFlags: {
            enabled: true,
          },
          swapsState: {
            swapsFeatureFlags: {
              ethereum: {
                extensionActive: true,
                mobileActive: false,
                smartTransactions: {
                  expectedDeadline: 45,
                  maxDeadline: 150,
                  extensionReturnTxHashAsap: false,
                },
              },
              smartTransactions: {
                extensionActive: true,
                mobileActive: false,
              },
            },
          },
          smartTransactionsState: {
            liveness: true,
          },
          ...mockNetworkState({
            id: 'network-configuration-id-1',
            chainId: CHAIN_IDS.MAINNET,
            rpcUrl: 'https://mainnet.infura.io/v3/',
            ticker: 'ETH',
          }),
        },
      },
    ),
  );
}

const Story = {
  title: 'Confirmations/Components/Confirm/SelectedGasFeeToken',
  component: SelectedGasFeeToken,
  decorators: [
    (story: any, { args }) => (
      <Provider store={getStore(args ?? {})}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <SelectedGasFeeToken />;

DefaultStory.storyName = 'Default';

export const NativeStory = () => <SelectedGasFeeToken />;

NativeStory.storyName = 'Native';
NativeStory.args = { noSelectedGasFeeToken: true };

export const NoTokenStory = () => <SelectedGasFeeToken />;

NoTokenStory.storyName = 'No Tokens';
NoTokenStory.args = { noSelectedGasFeeToken: true, gasFeeTokens: [] };
