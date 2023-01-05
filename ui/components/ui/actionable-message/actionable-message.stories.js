import React from 'react';

import Box from '../box';
import Typography from '../typography';
import {
  COLORS,
  DISPLAY,
  FLEX_WRAP,
} from '../../../helpers/constants/design-system';
import README from './README.mdx';
import { typeHash } from './actionable-message';
import ActionableMessage from '.';

export default {
  title: 'Components/UI/ActionableMessage',

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

export const Type = (args) => (
  <>
    {Object.keys(typeHash).map((type) => (
      <ActionableMessage
        {...args}
        message={args.message || type}
        key={type}
        type={type}
      />
    ))}
  </>
);

Type.args = {
  message: '',
};

export const OneAction = (args) => <ActionableMessage {...args} />;

OneAction.args = {
  primaryAction: {
    label: 'Dismiss',
  },
};

export const TwoActions = (args) => <ActionableMessage {...args} />;

TwoActions.args = {
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
  primaryAction: {
    label: 'Dismiss',
  },
  className: 'actionable-message--left-aligned',
};

export const WithIcon = (args) => <ActionableMessage {...args} />;

WithIcon.args = {
  className: 'actionable-message--left-aligned actionable-message--warning',
  useIcon: true,
  iconFillColor: 'var(--color-waring-default)',
};

export const PrimaryV2Action = (args) => <ActionableMessage {...args} />;

PrimaryV2Action.args = {
  message:
    'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
  useIcon: true,
  iconFillColor: 'var(--color-error-default)',
  type: 'danger',
  primaryActionV2: {
    label: 'I want to proceed anyway',
  },
};

export const OnTopOfContent = (args) => {
  return (
    <div>
      <Box display={DISPLAY.FLEX} gap={4} flexWrap={FLEX_WRAP.WRAP}>
        <Box padding={6} backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}>
          <Typography>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </Typography>
        </Box>
        <Box padding={6} backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}>
          <Typography>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </Typography>
        </Box>
        <Box padding={6} backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}>
          <Typography>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </Typography>
        </Box>
      </Box>
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16 }}>
        <ActionableMessage {...args} />
      </div>
    </div>
  );
};
