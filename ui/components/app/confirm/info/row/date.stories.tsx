import React from 'react';

import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowDate } from './date';

const ConfirmInfoRowDateStory = {
  title: 'Components/App/Confirm/InfoRowText',
  component: ConfirmInfoRowDate,

  decorators: [
    (story) => <ConfirmInfoRow label="Message">{story()}</ConfirmInfoRow>,
  ],

  argTypes: {
    url: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ date }) => <ConfirmInfoRowDate date={date} />;
DefaultStory.args = {
  date: '2021-09-30T16:25:24.000Z',
};

export default ConfirmInfoRowDateStory;
