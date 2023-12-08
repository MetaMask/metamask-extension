import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

import {
  FlexDirection,
  Display,
} from '../../../helpers/constants/design-system';
import { Box } from '..';
import { TextareaResize } from './textarea.types';
import { Textarea } from './textarea';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    autoFocus: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    cols: {
      control: 'number',
    },
    defaultValue: {
      control: 'text',
    },
    isDisabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
    id: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    onBlur: {
      action: 'onBlur',
    },
    onChange: {
      action: 'onChange',
    },
    onClick: {
      action: 'onClick',
    },
    onFocus: {
      action: 'onFocus',
    },
    placeholder: {
      control: 'text',
    },
    readOnly: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
    resize: {
      control: {
        type: 'select',
        options: Object.values(TextareaResize),
      },
    },
    rows: {
      control: 'number',
    },
    value: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Placeholder...',
  },
} as Meta<typeof Textarea>;

const Template: StoryFn<typeof Textarea> = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return <Textarea {...args} value={value} onChange={handleOnChange} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const AutoFocus = Template.bind({});
AutoFocus.args = { autoFocus: true, placeholder: 'Auto focus' };

export const ColsRows = Template.bind({});
ColsRows.args = { cols: 50, rows: 4, placeholder: 'cols: 50, rows: 4' };

export const DefaultValue = Template.bind({});
DefaultValue.args = { defaultValue: 'Default value' };

export const IsDisabled = Template.bind({});
IsDisabled.args = { disabled: true, placeholder: 'Disabled' };

export const ErrorStory = Template.bind({});
ErrorStory.args = { error: true, placeholder: 'Error' };
ErrorStory.storyName = 'Error';

export const MaxLength = Template.bind({});
MaxLength.args = { maxLength: 13, value: 'Max length 13' };

export const ReadOnly = Template.bind({});
ReadOnly.args = { readOnly: true, value: 'Read only' };

// eslint-disable-next-line @typescript-eslint/no-shadow
export const Required = Template.bind({});
Required.args = { required: true, placeholder: 'Required' };

// eslint-disable-next-line @typescript-eslint/no-shadow
export const Resize: StoryFn<typeof Textarea> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
    <Textarea
      {...args}
      resize={TextareaResize.Vertical}
      placeholder={`Resize ${TextareaResize.Vertical} resize={TextareaResize.Vertical}`}
    />
    <Textarea
      {...args}
      resize={TextareaResize.Horizontal}
      placeholder={`Resize ${TextareaResize.Horizontal} resize={TextareaResize.Horizontal}`}
    />
    <Textarea
      {...args}
      resize={TextareaResize.None}
      placeholder={`Resize ${TextareaResize.None} resize={TextareaResize.None}`}
    />
    <Textarea
      {...args}
      resize={TextareaResize.Both}
      placeholder={`Resize ${TextareaResize.Both} resize={TextareaResize.Both}`}
    />
    <Textarea
      {...args}
      resize={TextareaResize.Inherit}
      placeholder={`Resize ${TextareaResize.Inherit} resize={TextareaResize.Inherit}`}
    />
    <Textarea
      {...args}
      resize={TextareaResize.Initial}
      placeholder={`Resize ${TextareaResize.Initial} resize={TextareaResize.Initial}`}
    />
  </Box>
);
