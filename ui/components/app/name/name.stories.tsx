/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { NameType } from '@metamask/name-controller';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import Name from './name';

const addressNoSavedNameMock = '0xc0ffee254729296a45a3885639ac7e10f9d54978';
const addressSavedNameMock = '0xc0ffee254729296a45a3885639ac7e10f9d54977';
const addressSavedTokenMock = '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d';
const addressUnsavedTokenMock = '0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8';
const chainIdMock = '0x1';

const storeMock = configureStore({
  metamask: {
    providerConfig: {
      chainId: chainIdMock,
    },
    useTokenDetection: true,
    tokenList: {
      '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d': {
        address: '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d',
        symbol: 'IUSD',
        name: 'iZUMi Bond USD',
        iconUrl:
          'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d.png',
      },
      '0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8': {
        address: '0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8',
        symbol: 'USX',
        name: 'dForce USD',
        iconUrl:
          'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8.png',
      },
    },
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [addressNoSavedNameMock]: {
          [chainIdMock]: {
            proposedNames: {
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
            },
          },
        },
        [addressSavedNameMock]: {
          [chainIdMock]: {
            proposedNames: {
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
            },
            name: 'Test Token',
            sourceId: 'token',
          },
        },
        [addressSavedTokenMock]: {
          [chainIdMock]: {
            proposedNames: {},
            name: 'Saved Token Name',
            sourceId: 'token',
          },
        },
      },
    },
    nameSources: {
      ens: { label: 'Ethereum Name Service (ENS)' },
      etherscan: { label: 'Etherscan (Verified Contract Name)' },
      token: { label: 'Blockchain (Token Name)' },
      lens: { label: 'Lens Protocol' },
    },
  },
});

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
    disableEdit: {
      control: 'boolean',
      description: `Whether to prevent the modal from opening when the component is clicked.`,
      table: {
        defaultValue: { summary: false },
      },
    },
  },
  args: {
    value: addressNoSavedNameMock,
    type: NameType.ETHEREUM_ADDRESS,
    disableEdit: false,
  },
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
};

// eslint-disable-next-line jsdoc/require-param
/**
 * No name has been saved for the value and type.
 */
export const DefaultStory = (args) => {
  return <Name {...args} />;
};

DefaultStory.storyName = 'No Saved Name';

/**
 * A name was previously saved for this value and type.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const SavedNameStory = () => {
  return <Name value={addressSavedNameMock} type={NameType.ETHEREUM_ADDRESS} />;
};

SavedNameStory.storyName = 'Saved Name';

/**
 * No name was previously saved for this recognized token.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const UnsavedTokenNameStory = () => {
  return (
    <Name value={addressUnsavedTokenMock} type={NameType.ETHEREUM_ADDRESS} />
  );
};

UnsavedTokenNameStory.storyName = 'Unsaved Token Name';

/**
 * A name was previously saved for this recognized token.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const SavedTokenNameStory = () => {
  return (
    <Name value={addressSavedTokenMock} type={NameType.ETHEREUM_ADDRESS} />
  );
};

SavedTokenNameStory.storyName = 'Saved Token Name';

/**
 * Clicking the component will not display a modal to edit the name.
 */
export const EditDisabledStory = () => {
  return (
    <Name
      value={addressSavedNameMock}
      type={NameType.ETHEREUM_ADDRESS}
      disableEdit
    />
  );
};

EditDisabledStory.storyName = 'Edit Disabled';
