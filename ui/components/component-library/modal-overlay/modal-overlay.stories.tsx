import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ModalOverlay } from './modal-overlay';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/ModalOverlay',
  component: ModalOverlay,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
  },
} as Meta<typeof ModalOverlay>;

const Template: StoryFn<typeof ModalOverlay> = (args) => (
  <ModalOverlay {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const OnClick: StoryFn<typeof ModalOverlay> = (args) => {
  const [open, setOpen] = useState(false);
  const handleOnClick = () => {
    setOpen(!open);
  };
  return (
    <>
      <button onClick={handleOnClick}>Show modal overlay</button>
      {open && <ModalOverlay {...args} onClick={handleOnClick} />}
    </>
  );
};
