import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { EditGasFeesRow } from './edit-gas-fees-row';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { toHex } from '@metamask/controller-utils';
import { GasFeeToken } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567890',
  symbol: 'USDC',
  tokenAddress: '0x1234567890123456789012345678901234567891',
};

function getStore({
  advanced,
  selectedGasFeeToken,
}: { advanced?: boolean; selectedGasFeeToken?: Hex } = {}) {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
        selectedGasFeeToken,
      }),
      {
        metamask: {
          preferences: {
            showConfirmationAdvancedDetails: advanced ?? false,
            showFiatInTestnets: true,
          },
        },
      },
    ),
  );
}

const Story = {
  title: 'Components/App/Confirm/info/EditGasFeesRow',
  component: EditGasFeesRow,
  decorators: [
    (story: any, { args }) => (
      <Provider store={getStore(args ?? {})}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => (
  <EditGasFeesRow
    fiatFee="$1"
    nativeFee="0.001"
    fiatFeeWith18SignificantDigits="0.001234"
    supportsEIP1559={true}
    setShowCustomizeGasPopover={() => {}}
  />
);

DefaultStory.storyName = 'Default';

export const TokenStory = () => (
  <EditGasFeesRow
    fiatFee="$1"
    nativeFee="0.001"
    fiatFeeWith18SignificantDigits="0.001234"
    supportsEIP1559={true}
    setShowCustomizeGasPopover={() => {}}
  />
);

TokenStory.storyName = 'Token';
TokenStory.args = { selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress };

export const AdvancedStory = () => (
  <EditGasFeesRow
    fiatFee="$1"
    nativeFee="0.001"
    fiatFeeWith18SignificantDigits="0.001234"
    supportsEIP1559={true}
    setShowCustomizeGasPopover={() => {}}
  />
);

AdvancedStory.storyName = 'Advanced';
AdvancedStory.args = { advanced: true };

export const TokenAdvanced = () => (
  <EditGasFeesRow
    fiatFee="$1"
    nativeFee="0.001"
    fiatFeeWith18SignificantDigits="0.001234"
    supportsEIP1559={true}
    setShowCustomizeGasPopover={() => {}}
  />
);

TokenAdvanced.storyName = 'Token + Advanced';
TokenAdvanced.args = {
  advanced: true,
  selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
};
