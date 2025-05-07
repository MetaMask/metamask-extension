/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { NameType } from '@metamask/name-controller';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import Name, { NameProps } from './name';
import mockState from '../../../../test/data/mock-state.json';
import {
  EXPERIENCES_TYPE,
  FIRST_PARTY_CONTRACT_NAMES,
} from '../../../../shared/constants/first-party-contracts';
import { cloneDeep } from 'lodash';

const ADDRESS_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54978';
const ADDRESS_NFT_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const VARIATION_MOCK = '0x1';
const NAME_MOCK = 'Saved Name';

const ADDRESS_FIRST_PARTY_MOCK =
  FIRST_PARTY_CONTRACT_NAMES[EXPERIENCES_TYPE.METAMASK_BRIDGE][
    VARIATION_MOCK
  ].toLowerCase();

const PROPOSED_NAMES_MOCK = {
  ens: {
    proposedNames: ['test.eth'],
    lastRequestTime: 123,
    retryDelay: null,
  },
  etherscan: {
    proposedNames: ['TestContract'],
    lastRequestTime: 123,
    retryDelay: null,
  },
  token: {
    proposedNames: ['Test Token'],
    lastRequestTime: 123,
    retryDelay: null,
  },
  lens: {
    proposedNames: ['test.lens'],
    lastRequestTime: 123,
    retryDelay: null,
  },
};

const STATE_MOCK = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    useTokenDetection: true,
    tokensChainsCache: {},
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [ADDRESS_MOCK]: {
          [VARIATION_MOCK]: {
            proposedNames: PROPOSED_NAMES_MOCK,
          },
        },
        [ADDRESS_NFT_MOCK]: {
          [VARIATION_MOCK]: {
            proposedNames: PROPOSED_NAMES_MOCK,
          },
        },
        [ADDRESS_FIRST_PARTY_MOCK]: {
          [VARIATION_MOCK]: {
            proposedNames: PROPOSED_NAMES_MOCK,
          },
        },
      },
    },
    nameSources: {},
  },
};

/**
 * Displays the saved name for a raw value such as an Ethereum address.<br/><br/>
 * Clicking the component will display a modal to select a proposed name or enter a custom name.<br/><br/>
 * Proposed names are populated in the state using the `NameController` and the attached `NameProvider` instances.
 */
export default {
  title: 'Components/App/Name',
  component: Name,
  argTypes: {
    value: {
      control: 'text',
      description: 'The raw value to display the name of.',
    },
    type: {
      options: [NameType.ETHEREUM_ADDRESS],
      control: 'select',
      description: `The type of value.<br/><br/>
        Limited to the values in the \`NameType\` enum.`,
    },
    variation: {
      control: 'text',
      description: `The variation of the value.<br/><br/>For example, the chain ID if the type is Ethereum address.`,
    },
    disableEdit: {
      control: 'boolean',
      description: `Whether to prevent the modal from opening when the component is clicked.`,
      table: {
        defaultValue: { summary: false },
      },
    },
  },
  args: {
    value: ADDRESS_MOCK,
    type: NameType.ETHEREUM_ADDRESS,
    variation: VARIATION_MOCK,
    disableEdit: false,
  },
  render: ({ state, ...args }) => {
    const finalState = cloneDeep(STATE_MOCK);
    state?.(finalState);

    return (
      <Provider store={configureStore(finalState)}>
        <Name {...(args as NameProps)} />
      </Provider>
    );
  },
};

/**
 * No name has been saved for the value and type.
 */
export const NoSavedName = {
  name: 'No Saved Name',
  args: {
    value: ADDRESS_MOCK,
    type: NameType.ETHEREUM_ADDRESS,
    variation: VARIATION_MOCK,
  },
};

/**
 * A name was previously saved for this value and type.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const SavedNameStory = {
  name: 'Saved Name',
  args: {
    value: ADDRESS_MOCK,
    type: NameType.ETHEREUM_ADDRESS,
    variation: VARIATION_MOCK,
    state: (state) => {
      state.metamask.names[NameType.ETHEREUM_ADDRESS][ADDRESS_MOCK][
        VARIATION_MOCK
      ].name = NAME_MOCK;
    },
  },
};

/**
 * No name was previously saved for this recognized token.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const DefaultTokenNameStory = {
  name: 'Default ERC-20 Token Name',
  args: {
    value: ADDRESS_MOCK,
    type: NameType.ETHEREUM_ADDRESS,
    variation: VARIATION_MOCK,
    state: (state) => {
      state.metamask.tokensChainsCache = {
        [VARIATION_MOCK]: {
          data: {
            [ADDRESS_MOCK]: {
              address: ADDRESS_MOCK,
              symbol: 'IUSD',
              name: 'iZUMi Bond USD',
              iconUrl:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d.png',
            },
          },
        },
      };
    },
  },
};

/**
 * No name was previously saved for this watched NFT.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const DefaultWatchedNFTNameStory = {
  name: 'Default Watched NFT Name',
  args: {
    value: ADDRESS_MOCK,
    type: NameType.ETHEREUM_ADDRESS,
    variation: VARIATION_MOCK,
    state: (state) => {
      state.metamask.allNftContracts = {
        '0x123': {
          [VARIATION_MOCK]: [
            {
              address: ADDRESS_MOCK,
              name: 'Everything I Own',
            },
          ],
        },
      };
    },
  },
};

/**
 * No name was previously saved for this recognized NFT.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const DefaultNFTNameStory = {
  name: 'Default NFT Name',
  args: {
    value: ADDRESS_NFT_MOCK,
    type: NameType.ETHEREUM_ADDRESS,
    variation: VARIATION_MOCK,
  },
};

/**
 * No name was previously saved for this first-party contract.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const DefaultFirstPartyNameStory = {
  name: 'Default First-Party Name',
  args: {
    value: ADDRESS_FIRST_PARTY_MOCK,
    type: NameType.ETHEREUM_ADDRESS,
    variation: VARIATION_MOCK,
  },
};
