import React from 'react';
import { useArgs } from '@storybook/client-api';
import ShowHideToggle from '.';

export default {
  title: 'Components/UI/ShowHideToggle', // title should follow the folder structure location of the component. Don't use spaces.
  id: __filename,
  argTypes: {
    id: {
      control: 'text',
    },
    checked: {
      control: 'boolean',
    },
    onChange: {
      action: 'onChange',
    },
    ariaLabel: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    dataTestId: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => {
  const [{ checked }, updateArgs] = useArgs();
  const handleOnToggle = () => {
    updateArgs({ checked: !checked });
  };
  return (
    <ShowHideToggle {...args} checked={checked} onChange={handleOnToggle} />
  );
};

DefaultStory.args = {
  id: 'showHideToggle',
  checked: false,
};

DefaultStory.storyName = 'Default';
