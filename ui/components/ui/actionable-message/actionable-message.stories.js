import React from 'react';
import README from './README.mdx';
import ActionableMessage from '.';

export default {
  title: 'Components/UI/ActionableMessage',
  id: __filename,
  component: ActionableMessage,
  parameters: { docs: { page: README } },
  argTypes: {
    message: { control: 'text' },
    'primaryAction.label': { control: 'text' },
    'primaryAction.onClick': { action: 'primaryAction.onClick' },
    'primaryActionV2.label': { control: 'text' },
    'primaryActionV2.onClick': { action: 'primaryActionV2.onClick' },
    'secondaryAction.label': { control: 'text' },
    'secondaryAction.onClick': { action: 'secondaryAction.onClick' },
    className: { control: 'text' },
    type: { control: 'text' },
    withRightButton: { control: 'boolean' },
    infoTooltipText: { control: 'text' },
    useIcon: { control: 'boolean' },
    iconFillColor: { control: 'color' },
  },
};

export const DefaultStory = (args) => (
  <ActionableMessage
    {...args}
    primaryAction={{
      label: args['primaryAction.label'],
      onClick: args['primaryAction.onClick'],
    }}
    primaryActionV2={{
      label: args['primaryActionV2.label'],
      onClick: args['primaryActionV2.onClick'],
    }}
    secondaryAction={{
      label: args['secondaryAction.label'],
      onClick: args['secondaryAction.onClick'],
    }}
    message={args.message}
  />
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
};

export const OneAction = (args) => <ActionableMessage {...args} />;

OneAction.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  primaryAction: {
    label: 'Dismiss',
  },
};

export const TwoActions = (args) => <ActionableMessage {...args} />;

TwoActions.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  primaryAction: {
    label: 'Dismiss',
  },
  secondaryAction: {
    label: 'Okay',
  },
  className: 'actionable-message--warning',
};

export const LeftAligned = (args) => <ActionableMessage {...args} />;

LeftAligned.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  primaryAction: {
    label: 'Dismiss',
  },
  className: 'actionable-message--left-aligned',
};

export const WithIcon = (args) => <ActionableMessage {...args} />;

WithIcon.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  className: 'actionable-message--left-aligned actionable-message--warning',
  useIcon: true,
  iconFillColor: '#f8c000',
};

export const PrimaryV2Action = (args) => <ActionableMessage {...args} />;

PrimaryV2Action.args = {
  message:
    'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
  useIcon: true,
  iconFillColor: '#d73a49',
  type: 'danger',
  primaryActionV2: {
    label: 'I want to proceed anyway',
  },
};
