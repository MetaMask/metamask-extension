import React from 'react';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  SIZES,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES } from '../icon';
import { BUTTON_ICON_SIZES } from './button-icon.constants';
import { ButtonIcon } from './button-icon';
import README from './README.mdx';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/ButtonIcon',
  id: __filename,
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
      options: Object.values(COLORS),
    },
    disabled: {
      control: 'boolean',
    },
    href: {
      control: 'string',
    },
    icon: {
      control: 'select',
      options: Object.values(ICON_NAMES),
    },
    size: {
      control: 'select',
      options: Object.values(BUTTON_ICON_SIZES),
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
};

export const DefaultStory = (args) => <ButtonIcon {...args} />;

DefaultStory.args = {
  icon: ICON_NAMES.CLOSE_OUTLINE,
  ariaLabel: 'Close',
};

DefaultStory.storyName = 'Default';

export const Icon = (args) => (
  <ButtonIcon {...args} icon={ICON_NAMES.CLOSE_OUTLINE} ariaLabel="Close" />
);

export const Size = (args) => (
  <Box
    display={DISPLAY.FLEX}
    alignItems={ALIGN_ITEMS.BASELINE}
    gap={1}
    marginBottom={2}
  >
    <ButtonIcon
      {...args}
      size={SIZES.SM}
      icon={ICON_NAMES.CLOSE_OUTLINE}
      ariaLabel="Close"
    />
    <ButtonIcon
      {...args}
      size={SIZES.LG}
      color={COLORS.PRIMARY}
      icon={ICON_NAMES.CLOSE_OUTLINE}
      ariaLabel="Close"
    />
  </Box>
);

export const AriaLabel = (args) => (
  <>
    <ButtonIcon
      as="button"
      icon={ICON_NAMES.CLOSE_OUTLINE}
      ariaLabel="Close"
      {...args}
    />
    <ButtonIcon
      as="a"
      href="https://metamask.io/"
      target="_blank"
      color={COLORS.PRIMARY_DEFAULT}
      icon={ICON_NAMES.EXPORT}
      ariaLabel="Visit MetaMask.io"
      {...args}
    />
  </>
);

export const As = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW} gap={2}>
    <ButtonIcon {...args} icon={ICON_NAMES.CLOSE_OUTLINE} />
    <ButtonIcon
      as="a"
      href="#"
      {...args}
      color={COLORS.PRIMARY_DEFAULT}
      icon={ICON_NAMES.EXPORT}
    />
  </Box>
);

export const Href = (args) => (
  <ButtonIcon icon={ICON_NAMES.EXPORT} {...args} target="_blank" />
);

Href.args = {
  href: 'https://metamask.io/',
  color: COLORS.PRIMARY_DEFAULT,
};

export const Color = (args) => (
  <ButtonIcon {...args} icon={ICON_NAMES.CLOSE_OUTLINE} />
);

Color.args = {
  color: COLORS.PRIMARY_DEFAULT,
};

export const Disabled = (args) => (
  <ButtonIcon {...args} icon={ICON_NAMES.CLOSE_OUTLINE} />
);

Disabled.args = {
  disabled: true,
};
