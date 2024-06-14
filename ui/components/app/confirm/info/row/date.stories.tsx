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
  date: 1633019124000,
};

export default ConfirmInfoRowDateStory;
