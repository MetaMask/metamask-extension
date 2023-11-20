import React from 'react';
import README from './README.mdx';
import CheckBox, {
  CHECKED,
  INDETERMINATE,
  UNCHECKED,
} from './check-box.component';

const checkboxOptions = {
  [CHECKED]: CHECKED,
  [INDETERMINATE]: INDETERMINATE,
  [UNCHECKED]: UNCHECKED,
  True: true,
  False: false,
};

export default {
  title: 'Components/UI/Check Box(Deprecated)',

  component: CheckBox,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    id: { control: 'text' },
    onClick: { action: 'clicked' },
    checked: {
      options: ['CHECKED', 'INDETERMINATE', 'UNCHECKED', 'True', 'False'],
      control: 'select',
    },
    title: { control: 'text' },
    dataTestId: { control: 'text' },
  },
};

export const DefaultStory = (args) => (
  <CheckBox {...args} checked={checkboxOptions[args.checked]} />
);

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  checked: UNCHECKED,
  disabled: false,
  id: 'checkboxID',
};
