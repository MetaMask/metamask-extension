import React from 'react';
import { NameType } from '@metamask/name-controller';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import Name from './name';

const addressProposedMock = '0xc0ffee254729296a45a3885639AC7E10F9d54979';
const addressNoProposedMock = '0xc0ffee254729296a45a3885639AC7E10F9d54978';
const addressSavedNameMock = '0xc0ffee254729296a45a3885639AC7E10F9d54977';
const chainIdMock = '0x1';

const storeMock = configureStore({
  metamask: {
    providerConfig: {
      chainId: chainIdMock,
    },
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [addressProposedMock]: {
          [chainIdMock]: {
            proposedNames: {
              ens: ['opensea.eth'],
              opensea: ['OpenSea'],
            },
          },
        },
        [addressSavedNameMock]: {
          [chainIdMock]: {
            proposedNames: {
              ens: ['opensea.eth'],
            },
            name: 'OpenSea',
          },
        },
      },
    },
    nameProviders: {
      ens: 'Ethereum Name Service (ENS)',
      opensea: 'OpenSea',
    },
  },
});

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/App/Names/Name',
  component: Name,
  argTypes: {
    value: {
      control: 'text',
      table: { category: 'value' },
    },
    type: {
      options: [NameType.ETHEREUM_ADDRESS],
      control: 'select',
      table: { category: 'type' },
    },
    providerPriority: {
      control: 'object',
      table: { category: 'providerPriority' },
    },
  },
  args: {
    value: addressProposedMock,
    type: NameType.ETHEREUM_ADDRESS,
    providerPriority: ['ens'],
  },
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
};

export const DefaultStory = (args) => {
  return <Name {...args} />;
};

DefaultStory.storyName = 'Default';

export const ProposedNameStory = () => {
  return (
    <Name
      value={addressProposedMock}
      type={NameType.ETHEREUM_ADDRESS}
      providerPriority={['ens']}
    />
  );
};

ProposedNameStory.storyName = 'Proposed Name';

export const NoProposedNameStory = () => {
  return (
    <Name
      value={addressNoProposedMock}
      type={NameType.ETHEREUM_ADDRESS}
      providerPriority={['ens']}
    />
  );
};

NoProposedNameStory.storyName = 'No Proposed Name';

export const SavedNameStory = () => {
  return (
    <Name
      value={addressSavedNameMock}
      type={NameType.ETHEREUM_ADDRESS}
      providerPriority={['ens']}
    />
  );
};

SavedNameStory.storyName = 'Saved Name';
