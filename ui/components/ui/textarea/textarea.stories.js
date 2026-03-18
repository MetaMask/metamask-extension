import React from 'react';
import { useArgs } from '@storybook/client-api';

import {
  BorderStyle,
  BorderColor,
  Size,
} from '../../../helpers/constants/design-system';
import { RESIZE } from './textarea.constants';
import Textarea from '.';

export default {
  title: 'Components/UI/Textarea (deprecated)',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
    onChange: {
      action: 'onChange',
    },
    resize: {
      control: 'select',
      options: Object.values(RESIZE),
    },
    scrollable: {
      control: 'boolean',
    },
    height: {
      control: 'number',
    },
    boxProps: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => {
  const [{ value }, updateArgs] = useArgs();

  const handleOnChange = (e) => {
    updateArgs({
      value: e.target.value,
    });
  };
  return (
    <>
      <label htmlFor="textarea">Label</label>
      <Textarea {...args} value={value} onChange={handleOnChange} id="textarea">
        {args.children}
      </Textarea>
    </>
  );
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  value:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld',
  resize: RESIZE.BOTH,
  scrollable: false,
  boxProps: {
    borderColor: BorderColor.borderMuted,
    borderRadius: Size.SM,
    borderStyle: BorderStyle.solid,
    padding: [2, 4],
  },
  height: 'auto',
};
