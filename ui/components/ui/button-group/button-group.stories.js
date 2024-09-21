import React from 'react';

import Button from '../button';
import README from './README.mdx';
import ButtonGroup from '.';

export default {
  title: 'Components/UI/ButtonGroup',

  component: ButtonGroup,
  parameters: { docs: { page: README } },
  argTypes: {
    defaultActiveButtonIndex: { control: 'number' },
    noButtonActiveByDefault: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'array' },
    className: { control: 'text' },
    style: { control: 'object' },
    newActiveButtonIndex: { control: 'number' },
    variant: {
      options: ['radiogroup', 'default'],
      control: { type: 'select' },
    },
  },
};

export const DefaultStory = (args) => (
  <ButtonGroup {...args}>{args.children}</ButtonGroup>
);

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  defaultActiveButtonIndex: 1,
  noButtonActiveByDefault: false,
  disabled: false,
  children: ['cheap', 'average', 'fast'].map((label, index) => (
    <Button key={index}>{label}</Button>
  )),
  className: '',
  style: { width: '300px' },
  newActiveButtonIndex: 0,
  variant: 'default',
};

export const WithDisabledButton = (args) => (
  <ButtonGroup {...args}>{args.children}</ButtonGroup>
);

WithDisabledButton.args = {
  defaultActiveButtonIndex: 1,
  noButtonActiveByDefault: false,
  disabled: true,
  children: ['cheap', 'average', 'fast'].map((label, index) => (
    <Button key={index}>{label}</Button>
  )),
  className: '',
  style: { width: '300px' },
  newActiveButtonIndex: 0,
  variant: 'default',
};

export const WithRadioButton = (args) => (
  <ButtonGroup {...args}>{args.children}</ButtonGroup>
);

WithRadioButton.args = {
  defaultActiveButtonIndex: 1,
  noButtonActiveByDefault: false,
  disabled: false,
  children: ['cheap', 'average', 'fast'].map((label, index) => (
    <Button key={index}>{label}</Button>
  )),
  className: '',
  style: { width: '300px' },
  newActiveButtonIndex: 0,
  variant: 'radiogroup',
};

export const NoActiveButton = (args) => (
  <ButtonGroup {...args}>{args.children}</ButtonGroup>
);

NoActiveButton.args = {
  defaultActiveButtonIndex: 1,
  noButtonActiveByDefault: true,
  disabled: false,
  children: ['cheap', 'average', 'fast'].map((label, index) => (
    <Button key={index}>{label}</Button>
  )),
  className: '',
  style: { width: '300px' },
  newActiveButtonIndex: 0,
  variant: 'default',
};
