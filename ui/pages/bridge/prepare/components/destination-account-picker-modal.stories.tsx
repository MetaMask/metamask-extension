import React from 'react';
import { useSelector } from 'react-redux';
import { StoryFn } from '@storybook/react';
import { getAddress } from 'ethers/lib/utils';
import { Provider } from 'react-redux';
import { createBridgeMockStore } from '../../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../../store/store';
import { toBridgeToken } from '../../../../ducks/bridge/utils';
import { getFromAccount } from '../../../../ducks/bridge/selectors';
import { DestinationAccount } from '../types';
import { DestinationAccountPickerModal } from './destination-account-picker-modal';

export default {
  title: 'Pages/Bridge/DestinationAccountPickerModal',
  component: DestinationAccountPickerModal,
};

const Template: StoryFn<typeof DestinationAccountPickerModal> = (args) => {
  const fromAccount = useSelector(getFromAccount);

  return (
    <DestinationAccountPickerModal
      selectedAccount={fromAccount as unknown as DestinationAccount}
      isOpen={true}
      onClose={() => {}}
      onAccountSelect={(account) => console.log('Selected:', account)}
    />
  );
};

Template.decorators = [
  (story) => {
    return (
      <Provider
        store={configureStore(
          createBridgeMockStore({
            bridgeSliceOverrides: {
              toToken: null,
              fromToken: toBridgeToken({
                assetId:
                  'eip155:1/erc20:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                symbol: 'ETH',
                decimals: 18,
                name: 'ETH',
              }),
            },
            stateOverrides: {
              DNS: {
                resolutions: [
                  {
                    resolvedAddress: getAddress(
                      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7c1',
                    ),
                  },
                ],
              },
            },
          }),
        )}
      >
        {story()}
      </Provider>
    );
  },
];

export const WithSelectedAccount = Template.bind({});
