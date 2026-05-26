/**
 * NOTE: Requires `ENABLE_ENFORCED_SIMULATIONS=1` in `.metamaskrc` to render.
 * Without it, the eligibility check returns false and the component is empty.
 */
import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { TransactionContainerType } from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { DappSwapContextProvider } from '../../../context/dapp-swap';
import { EnforcedSimulationsRow } from './enforced-simulations-row';

const DELEGATION_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';

function getStore(
  overrides: Parameters<
    typeof genUnapprovedContractInteractionConfirmation
  >[0] = {},
) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    containerTypes: [TransactionContainerType.EnforcedSimulations],
    delegationAddress: DELEGATION_ADDRESS_MOCK,
    origin: 'https://some-dapp.com',
    txParamsOriginal: {
      from: '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b',
      to: '0x88aa6343307ec9a652ccddda3646e62b2f1a5125',
      value: '0x3782dace9d900000',
      data: '0xd0e30db0',
      gas: '0x5208',
    },
    ...overrides,
  });

  return configureStore(getMockConfirmStateForTransaction(transaction));
}

const Story = {
  title: 'Confirmations/Components/Rows/EnforcedSimulationsRow',
  component: EnforcedSimulationsRow,
  decorators: [
    (story: () => Meta<typeof EnforcedSimulationsRow>) => (
      <Provider store={getStore()}>
        <div
          style={{
            backgroundColor: 'var(--color-background-alternative)',
            padding: 30,
          }}
        >
          <ConfirmContextProvider>
            <DappSwapContextProvider>{story()}</DappSwapContextProvider>
          </ConfirmContextProvider>
        </div>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <EnforcedSimulationsRow />;
DefaultStory.storyName = 'Default';

export const DisabledStory = () => {
  const store = getStore({ containerTypes: [] });
  return (
    <Provider store={store}>
      <div
        style={{
          backgroundColor: 'var(--color-background-alternative)',
          padding: 30,
        }}
      >
        <ConfirmContextProvider>
          <DappSwapContextProvider>
            <EnforcedSimulationsRow />
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      </div>
    </Provider>
  );
};
DisabledStory.storyName = 'Disabled';

export const NotSupportedStory = () => {
  const store = getStore({ delegationAddress: undefined });
  return (
    <Provider store={store}>
      <div
        style={{
          backgroundColor: 'var(--color-background-alternative)',
          padding: 30,
        }}
      >
        <ConfirmContextProvider>
          <DappSwapContextProvider>
            <EnforcedSimulationsRow />
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      </div>
    </Provider>
  );
};
NotSupportedStory.storyName = 'Not Supported';
