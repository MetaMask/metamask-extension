import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../../component-library';
import { Header } from '.';

const story = {
  title: 'Components/Multichain/Page/Header',
  component: Header,
  argTypes: {
    endAdornment: {
      control: 'text',
    },
    startAdornment: {
      control: 'text',
    },
  },
  args: {},
};

export default story;

export const DefaultStory = (args) => <Header {...args}>Connect</Header>;
DefaultStory.storyName = 'Default';
DefaultStory.args = {};

export const StartAdornmentStory = (args) => <Header {...args}>Connect</Header>;
StartAdornmentStory.storyName = 'StartAccessory';
StartAdornmentStory.args = {
  startAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      ariaLabel="Back"
      iconName={IconName.ArrowLeft}
    />
  ),
};

export const EndAdornmentStory = (args) => <Header {...args}>Connect</Header>;
EndAdornmentStory.storyName = 'EndAccessory';
EndAdornmentStory.args = {
  endAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      ariaLabel="Close"
      iconName={IconName.Close}
    />
  ),
};

export const StartAndEndAdornmentStory = (args) => (
  <Header {...args}>Connect</Header>
);
StartAndEndAdornmentStory.storyName = 'StartEndAccessory';
StartAndEndAdornmentStory.args = {
  startAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      ariaLabel="Back"
      iconName={IconName.ArrowLeft}
    />
  ),
  endAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      ariaLabel="Close"
      iconName={IconName.Close}
    />
  ),
};

export const OverflowStory = (args) => (
  <Header {...args}>{'Connect'.repeat(100)}</Header>
);
OverflowStory.storyName = 'OverflowStory';
OverflowStory.args = {
  startAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      ariaLabel="Back"
      iconName={IconName.ArrowLeft}
    />
  ),
  endAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      ariaLabel="Close"
      iconName={IconName.Close}
    />
  ),
};
