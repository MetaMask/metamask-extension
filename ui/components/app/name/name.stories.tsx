/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { NameType } from '@metamask/name-controller';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
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
              ens: ['test.eth'],
              etherscan: ['TestContract'],
              token: ['TestToken'],
              lens: ['test.lens'],
            },
          },
        },
        [addressSavedNameMock]: {
          [chainIdMock]: {
            proposedNames: {
              ens: ['test.eth'],
              etherscan: ['TestContract'],
              token: ['TestToken'],
              lens: ['test.lens'],
            },
            name: 'TestToken',
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
 * Displays the saved or proposed name for a raw value such as an Ethereum address.<br/><br/>
 * Proposed names are populated in the state using the `NameController` and the attached `NameProvider` instances.<br/><br/>
 * These name providers use multiple sources such as ENS, Etherscan, and the Blockchain itself.<br/><br/>
 * Clicking the component will display a modal to select a proposed name or enter a custom name.
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
    sourcePriority: {
      control: 'object',
      description: `The order of priority to use when choosing which proposed name to display.<br/><br/>
         The available source IDs are defined by the \`NameProvider\` instances passed to the \`NameController\`.<br/><br/>
         Current options include:<br/><br/>
         \`ens\`<br/>
         \`etherscan\`<br/>
         \`lens\`<br/>
         \`token\``,
    },
    disableEdit: {
      control: 'boolean',
      description: `Whether to prevent the modal from opening when the component is clicked.`,
      table: {
        defaultValue: { summary: false },
      },
    },
    disableUpdate: {
      control: 'boolean',
      description: `Whether to disable updating the proposed names on render.`,
      table: {
        defaultValue: { summary: false },
      },
    },
    updateDelay: {
      control: 'number',
      description: `The minimum number of seconds to wait between updates of the proposed names on render.`,
      table: {
        defaultValue: { summary: 300 },
      },
    },
  },
  args: {
    value: addressProposedMock,
    type: NameType.ETHEREUM_ADDRESS,
    sourcePriority: ['ens'],
    disableEdit: false,
    disableUpdate: false,
    updateDelay: 300,
  },
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
};

// eslint-disable-next-line jsdoc/require-param
/**
 * A proposed name matching the value and type has been found in the state.<br/><br/>
 * Which proposed name is displayed is configurable by the `sourcePriority` property.
 */
export const DefaultStory = (args) => {
  return <Name {...args} />;
};

DefaultStory.storyName = 'Proposed Name';

/** No proposed name matching the value and type has been found in the state. */
export const NoProposedNameStory = () => {
  return (
    <Name
      value={addressNoProposedMock}
      type={NameType.ETHEREUM_ADDRESS}
      sourcePriority={['ens']}
    />
  );
};

NoProposedNameStory.storyName = 'No Proposed Name';

/**
 * A name was previously saved for this value and type.<br/><br/>
 * The component will still display a modal when clicked to edit the name.
 */
export const SavedNameStory = () => {
  return (
    <Name
      value={addressSavedNameMock}
      type={NameType.ETHEREUM_ADDRESS}
      sourcePriority={['ens']}
    />
  );
};

SavedNameStory.storyName = 'Saved Name';

/**
 * Clicking the component will not display a modal to edit the name.
 */
export const EditDisabledStory = () => {
  return (
    <Name
      value={addressSavedNameMock}
      type={NameType.ETHEREUM_ADDRESS}
      sourcePriority={['ens']}
      disableEdit
    />
  );
};

EditDisabledStory.storyName = 'Edit Disabled';
