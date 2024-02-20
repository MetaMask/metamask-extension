/* eslint-disable import/no-anonymous-default-export */

import React from 'react';
import { Provider } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import configureStore from '../../../store/store';
import SimulationDetails from './simulation-details';

const USER_MOCK = '0x1234567890123456789012345678901234567890';
const USER_2_MOCK = '0x1234567890123456789012345678901234567891';
const ERC20_TOKEN_MOCK = '0x2234567890123456789012345678901234567890';
const ERC721_TOKEN_MOCK = '0x3234567890123456789012345678901234567890';
const ERC1155_TOKEN_MOCK = '0x4234567890123456789012345678901234567890';

const storeMock = configureStore({
  metamask: {
    tokenList: {},
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [ERC20_TOKEN_MOCK]: { '*': { name: 'ERC20 Token' } },
        [ERC721_TOKEN_MOCK]: { '*': { name: 'ERC721 Token' } },
        [ERC1155_TOKEN_MOCK]: { '*': { name: 'ERC1155 Token' } },
      },
    },
  },
});

export default {
  title: 'Components/App/SimulationDetails',
  component: SimulationDetails,
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
};

// eslint-disable-next-line jsdoc/require-param
export const DefaultStory = () => {
  return (
    <SimulationDetails
      fromAddress={USER_MOCK}
      simulationData={{
        balanceChanges: {
          [USER_MOCK]: {
            before: '0x1',
            after: '0x2',
            difference: '0x12345678912345678',
            isDecrease: true,
          },
        },
        events: {
          erc20Transfer: [
            {
              contractAddress: ERC20_TOKEN_MOCK,
              from: USER_2_MOCK,
              to: USER_MOCK,
              value: '0x123456789123456',
            },
          ],
          erc721Transfer: [
            {
              contractAddress: ERC721_TOKEN_MOCK,
              from: USER_2_MOCK,
              to: USER_MOCK,
              tokenId: '0x1234',
            },
          ],
          erc1155TransferSingle: [
            {
              contractAddress: ERC1155_TOKEN_MOCK,
              operator: USER_2_MOCK,
              from: USER_MOCK,
              to: USER_2_MOCK,
              id: '0x12345',
              value: '0x3',
            },
          ],
        },
      }}
    />
  );
};

DefaultStory.storyName = 'Default';
