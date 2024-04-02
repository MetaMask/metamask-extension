import React from 'react';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowText } from './text';

const ConfirmInfoRowTextStory = {
  title: 'Components/App/Confirm/InfoRowText',
  component: ConfirmInfoRowText,

  decorators: [
    (story) => <ConfirmInfoRow label="Message">{story()}</ConfirmInfoRow>,
  ],

  argTypes: {
    url: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ text }) => <ConfirmInfoRowText text={text} />;
DefaultStory.args = {
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
};

export default ConfirmInfoRowTextStory;
