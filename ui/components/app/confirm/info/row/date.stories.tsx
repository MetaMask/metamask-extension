import React from 'react';

import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowDate } from './date';

const ConfirmInfoRowDateStory = {
  title: 'Components/App/Confirm/Info/Row/ConfirmInfoRowDate',
  component: ConfirmInfoRowDate,

  decorators: [
    (story) => <ConfirmInfoRow label="Date">{story()}</ConfirmInfoRow>,
  ],

  argTypes: {
    url: {
      control: 'date',
    },
  },
};

export const DefaultStory = ({ date }) => <ConfirmInfoRowDate unixTimestamp={date} />;
DefaultStory.args = {
  date: 1633019124,
};

export default ConfirmInfoRowDateStory;
