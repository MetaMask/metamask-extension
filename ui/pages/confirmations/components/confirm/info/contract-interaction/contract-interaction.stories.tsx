import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../store/store';
import ContractInteractionInfo from './contract-interaction';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: genUnapprovedContractInteractionConfirmation(),
  },
});

const Story = {
  title: 'Components/App/Confirm/info/ContractInteractionInfo',
  component: ContractInteractionInfo,
  decorators: [
    (story: () => Meta<typeof ContractInteractionInfo>) => (
      <Provider store={store}>{story()}</Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <ContractInteractionInfo />;

DefaultStory.storyName = 'Default';
