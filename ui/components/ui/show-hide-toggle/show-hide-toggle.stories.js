import React from 'react';
import ShowHideToggle from '.';

export default {
  title: 'Components/UI/ShowHideToggle', // title should follow the folder structure location of the component. Don't use spaces.

  argTypes: {
    id: {
      control: 'text',
    },
    ariaLabelHidden: {
      control: 'text',
    },
    ariaLabelShown: {
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
    onChange: {
      action: 'onChange',
    },
    shown: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => {
  return <ShowHideToggle {...args} />;
};

DefaultStory.args = {
  id: 'showHideToggle',
  ariaLabelHidden: 'hidden',
  ariaLabelShown: 'shown',
  shown: false,
};

DefaultStory.storyName = 'Default';
