import React from 'react';
import InlineAlert, { InlineAlertProps } from './inline-alert';
import { Severity } from '../../../../helpers/constants/design-system';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'Confirmations/Components/Alerts/InlineAlert',
  component: InlineAlert,
  argTypes: {
    severity: {
      control: 'select',
      options: [Severity.Info, Severity.Warning, Severity.Danger],
      description: 'The severity of the alert. Options: Severity.Warning, Severity.Info and Severity.Danger.',
      defaultValue: Severity.Info,
    },
    onClick: {
      action: 'onClick',
      description: 'The onClick handler for the inline alerts.',
    },
  },
  args: {
    onClick: () => {},
  },
} as Meta<typeof InlineAlert>;

const Template: StoryFn<InlineAlertProps> = (args) => <InlineAlert {...args} />;

/**
 * Inline Informative alert. This is the default alert type.
 */
export const Info = Template.bind({});
Info.args = {
  severity: Severity.Info,
};

/**
 * Inline Non-Critical alert.
 */
export const Warning = Template.bind({});
Warning.args = {
  severity: Severity.Warning,
};

/**
 * Inline Critical alert.
 */
export const Danger = Template.bind({});
Danger.args = {
  severity: Severity.Danger,
};
