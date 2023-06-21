import React from 'react';
import { ACTIVITY_ICONS } from './transaction-activity-log-icon.component';
import TransactionActivityLogIcon from '.';

export default {
  title: 'Components/App/TransactionActivityLog/TransactionActivityLogIcon',

  argTypes: {
    className: {
      control: 'text',
    },
    eventKey: {
      control: 'select',
      options: Object.keys(ACTIVITY_ICONS),
    },
  },
  args: {
    eventKey: Object.keys(ACTIVITY_ICONS)[0],
  },
};

export const DefaultStory = (args) => <TransactionActivityLogIcon {...args} />;

DefaultStory.storyName = 'Default';
