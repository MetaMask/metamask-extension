import React from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
  ConfirmInfoRowSize,
} from './row';

const ConfirmInfoRowStory = {
  title: 'Components/App/Confirm/InfoRow',

  component: ConfirmInfoRow,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowVariant),
    },
    rowVariant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowSize),
    },
    label: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <ConfirmInfoRow {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  label: 'Key',
  children: 'Value',
};

export const CopyEnabledStory = (args) => <ConfirmInfoRow {...args} />;

CopyEnabledStory.storyName = 'CopyEnabled';

CopyEnabledStory.args = {
  label: 'Key',
  children: 'Value',
  copyEnabled: true,
  copyText: 'Some copy text',
};

export const SmallStory = (args) => <ConfirmInfoRow {...args} />;

SmallStory.storyName = 'Small';

SmallStory.args = {
  label: 'Transaction Fee',
  children: '$0.50',
  rowVariant: ConfirmInfoRowSize.Small,
};

export default ConfirmInfoRowStory;
