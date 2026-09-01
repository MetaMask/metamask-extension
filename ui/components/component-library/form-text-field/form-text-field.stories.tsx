import React, { ChangeEvent } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

import { FormTextField } from './form-text-field';

export default {
  title: 'Components/ComponentLibrary/FormTextField (deprecated)',
  component: FormTextField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the `FormTextField` from `@metamask/design-system-react` instead.',
      },
    },
  },
  args: {
    placeholder: 'Form text field',
    label: 'Label',
    id: 'form-text-field',
    helpText: 'Help text',
  },
} as Meta<typeof FormTextField>;

const Template: StoryFn<typeof FormTextField> = (args) => {
  const [{ value = '' }, updateArgs] = useArgs();
  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateArgs({ value: e.target.value });
  };
  return <FormTextField {...args} value={value} onChange={handleOnChange} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
