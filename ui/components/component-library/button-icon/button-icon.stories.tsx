import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
  AlignItems,
  Color,
  DISPLAY,
  FLEX_DIRECTION,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES } from '../icon';
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
    color: {
      control: 'select',
      options: Object.values(Color),
    },
    iconName: {
      control: 'select',
      options: Object.values(ICON_NAMES),
    },
    size: {
      control: 'select',
      options: Object.values(ButtonIconSize),
    },
  },
} as ComponentMeta<typeof ButtonIcon>;

const Template: ComponentStory<typeof ButtonIcon> = (args) => (
  <ButtonIcon {...args} />
);

export const DefaultStory = Template.bind({});

DefaultStory.args = {
  iconName: ICON_NAMES.CLOSE,
  ariaLabel: 'Close',
};

DefaultStory.storyName = 'Default';

export const IconName = (args) => <ButtonIcon {...args} />;

IconName.args = {
  iconName: ICON_NAMES.CLOSE,
  ariaLabel: 'Close',
};

export const SizeStory = (args) => (
  <Box
    display={DISPLAY.FLEX}
    alignItems={AlignItems.baseline}
    gap={1}
    marginBottom={2}
  >
    <ButtonIcon
      {...args}
      size={Size.SM}
      iconName={ICON_NAMES.CLOSE}
      ariaLabel="Close"
    />
    <ButtonIcon
      {...args}
      size={Size.LG}
      color={Color.primaryDefault}
      iconName={ICON_NAMES.CLOSE}
      ariaLabel="Close"
    />
  </Box>
);

SizeStory.storyName = 'Size';

export const AriaLabel = (args) => (
  <>
    <ButtonIcon
      as="button"
      iconName={ICON_NAMES.CLOSE}
      ariaLabel="Close"
      {...args}
    />
    <ButtonIcon
      as="a"
      href="https://metamask.io/"
      target="_blank"
      color={Color.primaryDefault}
      iconName={ICON_NAMES.EXPORT}
      ariaLabel="Visit MetaMask.io"
      {...args}
    />
  </>
);

export const As = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW} gap={2}>
    <ButtonIcon {...args} iconName={ICON_NAMES.CLOSE} ariaLabel="close" />
    <ButtonIcon
      as="a"
      href="#"
      {...args}
      color={Color.primaryDefault}
      iconName={ICON_NAMES.EXPORT}
      ariaLabel="demo"
    />
  </Box>
);

export const Href = (args) => (
  <ButtonIcon iconName={ICON_NAMES.EXPORT} {...args} target="_blank" />
);

Href.args = {
  ariaLabel: 'Visit Metamask.io',
  href: 'https://metamask.io/',
  color: Color.primaryDefault,
};

export const ColorStory = (args) => (
  <ButtonIcon {...args} iconName={ICON_NAMES.CLOSE} ariaLabel="close" />
);
ColorStory.storyName = 'Color';

ColorStory.args = {
  color: Color.primaryDefault,
};

export const Disabled = (args) => (
  <ButtonIcon {...args} iconName={ICON_NAMES.CLOSE} ariaLabel="close" />
);

Disabled.args = {
  disabled: true,
};
