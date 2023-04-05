import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
  AlignItems,
  IconColor,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { IconName } from '../icon';
import { BUTTON_ICON_SIZES } from './button-icon.constants';
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
    ariaLabel: {
      control: 'text',
    },
    as: {
      control: 'select',
      options: ['button', 'a'],
    },
    className: {
      control: 'text',
    },
    color: {
      control: 'select',
      options: Object.values(IconColor),
    },
    disabled: {
      control: 'boolean',
    },
    href: {
      control: 'text',
    },
    iconName: {
      control: 'select',
      options: Object.values(IconName),
    },
    size: {
      control: 'select',
      options: Object.values(BUTTON_ICON_SIZES),
    },
  },
} as ComponentMeta<typeof ButtonIcon>;

const Template: ComponentStory<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} />
);

export const DefaultStory = Template.bind({});

DefaultStory.args = {
  iconName: IconName.Close,
  ariaLabel: 'Close',
};

DefaultStory.storyName = 'Default';

export const IconNameStory = Template.bind({});

IconNameStory.args = {
  iconName: IconName.Close,
  ariaLabel: 'Close',
};

IconNameStory.storyName = 'IconName';

export const Size: ComponentStory<typeof ButtonIcon> = (args) => (
  <Box
    display={DISPLAY.FLEX}
    alignItems={AlignItems.baseline}
    gap={1}
    marginBottom={2}
  >
    <ButtonIcon
      {...args}
      size={BUTTON_ICON_SIZES.SM}
      iconName={IconName.Close}
      ariaLabel="Close"
    />
    <ButtonIcon
      {...args}
      size={BUTTON_ICON_SIZES.LG}
      color={IconColor.primaryDefault}
      iconName={IconName.Close}
      ariaLabel="Close"
    />
  </Box>
);

export const AriaLabel: ComponentStory<typeof ButtonIcon> = (args) => (
  <>
    <ButtonIcon
      as="button"
      iconName={IconName.Close}
      ariaLabel="Close"
      {...args}
    />
    <ButtonIcon
      as="a"
      href="https://metamask.io/"
      target="_blank"
      color={IconColor.primaryDefault}
      iconName={IconName.Export}
      ariaLabel="Visit MetaMask.io"
      {...args}
    />
  </>
);

export const As: ComponentStory<typeof ButtonIcon> = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW} gap={2}>
    <ButtonIcon {...args} iconName={IconName.Close} ariaLabel="close" />
    <ButtonIcon
      as="a"
      href="#"
      {...args}
      color={IconColor.primaryDefault}
      iconName={IconName.Export}
      ariaLabel="demo"
    />
  </Box>
);

export const Href: ComponentStory<typeof ButtonIcon> = (args) => (
  <ButtonIcon iconName={IconName.Export} {...args} target="_blank" />
);

Href.args = {
  ariaLabel: 'Visit Metamask.io',
  href: 'https://metamask.io/',
  color: IconColor.primaryDefault,
};

export const ColorStory: ComponentStory<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} iconName={IconName.Close} ariaLabel="close" />
);
ColorStory.storyName = 'Color';

ColorStory.args = {
  color: IconColor.primaryDefault,
};

export const Disabled: ComponentStory<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} iconName={IconName.Close} ariaLabel="close" />
);

Disabled.args = {
  disabled: true,
};
