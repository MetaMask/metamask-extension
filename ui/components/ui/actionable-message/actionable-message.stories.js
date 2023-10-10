import React from 'react';
import { action } from '@storybook/addon-actions';

import README from './README.mdx';
import ActionableMessage from '.';

export default {
  title: 'Components/UI/ActionableMessage',
  id: __filename,
  component: ActionableMessage,
  parameters: { docs: { page: README } },
  argTypes: {
    message: { control: 'text' },
    primaryAction: {
      label: { control: 'text' },
    },
    secondaryAction: {
      label: { control: 'text' },
    },
    className: { control: 'text' },
    type: { control: 'text' },
    withRightButton: { control: 'boolean' },
    infoTooltipText: { control: 'text' },
    useIcon: { control: 'boolean' },
    iconFillColor: { control: 'color' },
  },
};

export const DefaultStory = (args) => (
  <ActionableMessage {...args} message={args.message} />
);

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
};

export const OneAction = (args) => (
  <ActionableMessage
    {...args}
    message={args.message}
    primaryAction={args.primaryAction}
  />
);

OneAction.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  primaryAction: {
    label: 'Dismiss',
    onClick: action('Primary Action Click'),
  },
};

export const TwoActions = (args) => (
  <ActionableMessage
    message={args.message}
    primaryAction={args.primaryAction}
    secondaryAction={args.secondaryAction}
    className={args.className}
  />
);

TwoActions.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  primaryAction: {
    label: 'Dismiss',
    onClick: action('Primary Action Click'),
  },
  secondaryAction: {
    label: 'Okay',
    onClick: action('Secondary Action Click'),
  },
  className: 'actionable-message--warning',
};

export const LeftAligned = (args) => (
  <ActionableMessage
    message={args.message}
    primaryAction={args.primaryAction}
    className={args.className}
  />
);

LeftAligned.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  primaryAction: {
    label: 'Dismiss',
    onClick: action('Primary Action Click'),
  },
  className: 'actionable-message--left-aligned',
};

export const WithIcon = (args) => (
  <ActionableMessage
    message={args.message}
    className={args.className}
    useIcon={args.useIcon}
    iconFillColor={args.iconFillColor}
  />
);

WithIcon.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  className: 'actionable-message--left-aligned actionable-message--warning',
  useIcon: true,
  iconFillColor: '#f8c000',
};
