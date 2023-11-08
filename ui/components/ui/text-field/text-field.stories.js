import React from 'react';
import PropTypes from 'prop-types';
import { BannerAlert } from '../../component-library';
import { Severity } from '../../../helpers/constants/design-system';
import README from './README.mdx';
import TextField from '.';

const Deprecated = ({ children }) => (
  <>
    <BannerAlert
      severity={Severity.Warning}
      title="Deprecated"
      description="<TextField/> has been deprecated in favor of <TextField/>"
      marginBottom={4}
    />
    {children}
  </>
);

Deprecated.propTypes = {
  children: PropTypes.node,
};

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

export const DefaultStory = (args) => (
  <Deprecated>
    <TextField {...args} />
  </Deprecated>
);
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  label: 'Text',
  type: 'text',
};

export const Password = (args) => (
  <Deprecated>
    <TextField {...args} />
  </Deprecated>
);
Password.args = {
  label: 'Password',
  type: 'password',
};
export const TextError = (args) => (
  <Deprecated>
    <TextField {...args} />
  </Deprecated>
);
TextError.args = {
  type: 'text',
  label: 'Name',
  error: 'Invalid Value',
};
export const MascaraText = (args) => (
  <Deprecated>
    <TextField {...args} />
  </Deprecated>
);
MascaraText.args = {
  label: 'Text',
  type: 'text',
  largeLabel: true,
};

export const MaterialText = (args) => (
  <Deprecated>
    <TextField {...args} />
  </Deprecated>
);
MaterialText.args = {
  label: 'Text',
  type: 'text',
  theme: 'material',
};

export const MaterialPassword = (args) => (
  <Deprecated>
    <TextField {...args} />
  </Deprecated>
);
MaterialPassword.args = {
  label: 'Password',
  type: 'password',
  theme: 'material',
};

export const MaterialError = (args) => (
  <Deprecated>
    <TextField {...args} />
  </Deprecated>
);
MaterialError.args = {
  type: 'text',
  label: 'Name',
  error: 'Invalid Value',
  theme: 'material',
};
