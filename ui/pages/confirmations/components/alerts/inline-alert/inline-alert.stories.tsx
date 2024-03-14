import React from 'react';
import InlineAlert, { InlineAlertProps } from './inline-alert';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Meta, StoryFn } from '@storybook/react';

const ADDRESS_VALUE = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const ADDRESS_LABEL = 'address';

export default {
  title: 'Confirmations/Components/Alerts/InlineAlert',
  component: InlineAlert,
  argTypes: {
    severity: {
      control: 'select',
      options: [Severity.Info, Severity.Warning, Severity.Danger],
    },
  },
  args: {
    value: ADDRESS_VALUE,
    label: ADDRESS_LABEL,
  },
} as Meta<typeof InlineAlert>;

const Template: StoryFn<InlineAlertProps> = (args) => <InlineAlert {...args} />;

export const Info = Template.bind({});
Info.args = {
  severity: Severity.Info,
};

export const Warning = Template.bind({});
Warning.args = {
  severity: Severity.Warning,
};

export const Danger = Template.bind({});
Danger.args = {
  severity: Severity.Danger,
};
