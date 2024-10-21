import React from 'react';
import { Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import NoteToTrader from '.';
import { getMockContractInteractionConfirmState } from '../../../../test/data/confirmations/helper';
import configureStore from '../../../store/store';
import { ConfirmContextProvider } from '../../../pages/confirmations/context/confirm';

const store = configureStore(getMockContractInteractionConfirmState());

export default {
  title: 'Components/Institutional/NoteToTrader',
  component: NoteToTrader,
  decorators: [
    (story: () => Meta<typeof NoteToTrader>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
  args: {
    placeholder:
      'The approver will see this note when approving the transaction at the custodian.',
    noteText: '',
    labelText: 'Transaction note',
    maxLength: 280,
    onChange: () => {
      /**/
    },
  },
};

type NoteToTraderArgs = {
  placeholder: string;
  noteText: string;
  labelText: string;
  maxLength: number;
  onChange: () => void;
};

export const DefaultStory = (args: NoteToTraderArgs) => (
  <NoteToTrader {...args} />
);

DefaultStory.storyName = 'NoteToTrader';
