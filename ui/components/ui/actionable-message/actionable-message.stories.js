import React from 'react';

import ActionableMessage from '.';

export default {
  title: 'Components/UI/ActionableMessage (deprecated)',
  component: ActionableMessage,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release.',
      },
    },
  },
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
    roundedButtons: { control: 'boolean' },
  },
  args: {
    message:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
