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
    maxLength: '280',
    onChange: () => {
      /**/
    },
  },
};

export const DefaultStory = (args) => <NoteToTrader {...args} />;

DefaultStory.storyName = 'NoteToTrader';
