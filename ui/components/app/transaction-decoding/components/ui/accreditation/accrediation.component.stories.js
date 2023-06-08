import React from 'react';
import Accreditation from './accreditation.component';

export default {
  title: 'Components/App/Accrediation', // title should follow the folder structure location of the component. Don't use spaces.

  argTypes: {
    fetchVia: {
      control: 'string',
    },
    address: { control: 'string' },
  },
  args: {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
};

export const DefaultStory = (args) => <Accreditation {...args} />;

DefaultStory.storyName = 'Default';
