import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { IconColor } from '../../../helpers/constants/design-system';
import { IconName } from '..';
import { ButtonIconSize } from './button-icon.types';
import { ButtonIcon } from './button-icon';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/ButtonIcon',
  component: ButtonIcon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
    },
  },
  args: {
    iconName: IconName.Close,
    ariaLabel: 'Close',
  },
} as Meta<typeof ButtonIcon>;

const Template: StoryFn<typeof ButtonIcon> = (args) => <ButtonIcon {...args} />;

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';

export const IconNameStory: StoryFn<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} />
);

IconNameStory.storyName = 'IconName';

export const SizeStory: StoryFn<typeof ButtonIcon> = (args) => (
  <>
    <ButtonIcon {...args} size={ButtonIconSize.Sm} />
    <ButtonIcon {...args} size={ButtonIconSize.Md} />
    <ButtonIcon {...args} size={ButtonIconSize.Lg} />
  </>
);

SizeStory.storyName = 'Size';

export const AriaLabel: StoryFn<typeof ButtonIcon> = (args) => (
  <>
    <ButtonIcon {...args} />
    <ButtonIcon
      {...args}
      as="a"
      href="https://metamask.io/"
      target="_blank"
      color={IconColor.primaryDefault}
      iconName={IconName.Export}
      ariaLabel="Visit MetaMask.io"
    />
  </>
);

export const As: StoryFn<typeof ButtonIcon> = (args) => (
  <>
    <ButtonIcon {...args} />
    <ButtonIcon
      {...args}
      as="a"
      href="#"
      color={IconColor.primaryDefault}
      iconName={IconName.Export}
      ariaLabel="demo"
    />
  </>
);

export const Href: StoryFn<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} />
);

Href.args = {
  ariaLabel: 'Visit Metamask.io',
  href: 'https://metamask.io/',
  target: '_blank',
  color: IconColor.primaryDefault,
  iconName: IconName.Export,
};

export const ColorStory: StoryFn<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} />
);
ColorStory.storyName = 'Color';

ColorStory.args = {
  color: IconColor.primaryDefault,
};

export const Disabled: StoryFn<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} />
);

Disabled.args = {
  disabled: true,
};
