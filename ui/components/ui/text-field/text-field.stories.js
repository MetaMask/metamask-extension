import React from 'react';
import README from './README.mdx';
import TextField from '.';

export default {
  title: 'Components/UI/TextField',

  component: TextField,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    error: { control: 'text' },
    classes: { control: 'object' },
    dir: { control: 'text' },
    theme: {
      control: 'select',
      options: ['bordered', 'material', 'material-white-padded'],
    },
    startAdornment: { control: 'element' },
    largeLabel: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    autoComplete: { control: 'text' },
  },
};

export const DefaultStory = (args) => <TextField {...args} />;
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  label: 'Text',
  type: 'text',
};

export const Password = (args) => <TextField {...args} />;
Password.args = {
  label: 'Password',
  type: 'password',
};
export const TextError = (args) => <TextField {...args} />;
TextError.args = {
  type: 'text',
  label: 'Name',
  error: 'Invalid Value',
};
export const MascaraText = (args) => <TextField {...args} />;
MascaraText.args = {
  label: 'Text',
  type: 'text',
  largeLabel: true,
};

export const MaterialText = (args) => <TextField {...args} />;
MaterialText.args = {
  label: 'Text',
  type: 'text',
  theme: 'material',
};

export const MaterialPassword = (args) => <TextField {...args} />;
MaterialPassword.args = {
  label: 'Password',
  type: 'password',
  theme: 'material',
};

export const MaterialError = (args) => <TextField {...args} />;
MaterialError.args = {
  type: 'text',
  label: 'Name',
  error: 'Invalid Value',
  theme: 'material',
};
