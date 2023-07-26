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
/**
 * @deprecated The `<Checkbox />` component has been deprecated in favor of the new `<Checkbox>` component from the component-library.
 * Please update your code to use the new `<Checkbox>` component instead, which can be found at ui/components/component-library/checkbox/checkbox.tsx.
 * You can find documentation for the new Checkbox component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-checkbox--docs}
 * If you would like to help with the replacement of the old Checkbox component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20163}
 */
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
