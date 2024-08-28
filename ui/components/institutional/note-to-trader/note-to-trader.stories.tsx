import React from 'react';
import NoteToTrader from '.';

export default {
  title: 'Components/Institutional/NoteToTrader',
  component: NoteToTrader,
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
