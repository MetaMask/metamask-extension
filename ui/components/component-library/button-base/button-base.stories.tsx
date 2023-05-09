import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
  AlignItems,
  BackgroundColor,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { TextDirection, IconName, ValidTag } from '..';

import { ButtonBaseSize } from './button-base.types';
import { ButtonBase } from './button-base';
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
  title: 'Components/ComponentLibrary/ButtonBase',

  component: ButtonBase,
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
    block: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    startIconName: {
      control: 'select',
      options: Object.values(IconName),
    },
    endIconName: {
      control: 'select',
      options: Object.values(IconName),
    },
    loading: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: Object.values(ButtonBaseSize),
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
  args: {
    children: 'Button Base',
  },
} as ComponentMeta<typeof ButtonBase>;

export const DefaultStory: ComponentStory<typeof ButtonBase> = (args) => (
  <ButtonBase {...args} />
);

DefaultStory.storyName = 'Default';

export const SizeStory: ComponentStory<typeof ButtonBase> = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.baseline}
      gap={1}
      marginBottom={2}
    >
      <ButtonBase {...args} size={ButtonBaseSize.Sm}>
        Button SM
      </ButtonBase>
      <ButtonBase {...args} size={ButtonBaseSize.Md}>
        Button MD
      </ButtonBase>
      <ButtonBase {...args} size={ButtonBaseSize.Lg}>
        Button LG
      </ButtonBase>
    </Box>
  </>
);

SizeStory.storyName = 'Size';

export const Block: ComponentStory<typeof ButtonBase> = (args) => (
  <>
    <ButtonBase {...args} marginBottom={2}>
      Default Button
    </ButtonBase>
    <ButtonBase {...args} block marginBottom={2}>
      Block Button
    </ButtonBase>
  </>
);

export const As: ComponentStory<typeof ButtonBase> = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW} gap={2}>
    <ButtonBase {...args}>Button Element</ButtonBase>
    <ButtonBase as={ValidTag.A} href="#" {...args}>
      Anchor Element
    </ButtonBase>
  </Box>
);

export const Href: ComponentStory<typeof ButtonBase> = (args) => (
  <ButtonBase {...args}>Anchor Element</ButtonBase>
);

Href.args = {
  href: '/metamask',
};

export const ExternalLink: ComponentStory<typeof ButtonBase> = (args) => (
  <ButtonBase {...args}>Anchor element with external link</ButtonBase>
);

ExternalLink.args = {
  href: 'https://metamask.io',
  externalLink: true,
};

export const Disabled: ComponentStory<typeof ButtonBase> = (args) => (
  <ButtonBase {...args}>Disabled Button</ButtonBase>
);

Disabled.args = {
  disabled: true,
};

export const Loading: ComponentStory<typeof ButtonBase> = (args) => (
  <ButtonBase {...args}>Loading Button</ButtonBase>
);

Loading.args = {
  loading: true,
};

export const StartIconName: ComponentStory<typeof ButtonBase> = (args) => (
  <ButtonBase {...args} startIconName={IconName.AddSquare}>
    Button
  </ButtonBase>
);

export const EndIconName: ComponentStory<typeof ButtonBase> = (args) => (
  <ButtonBase {...args} endIconName={IconName.Arrow2Right}>
    Button
  </ButtonBase>
);

export const Rtl: ComponentStory<typeof ButtonBase> = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <ButtonBase
      {...args}
      startIconName={IconName.AddSquare}
      endIconName={IconName.Arrow2Right}
    >
      Button Demo
    </ButtonBase>
    <ButtonBase
      {...args}
      startIconName={IconName.AddSquare}
      endIconName={IconName.Arrow2Right}
      textDirection={TextDirection.RightToLeft}
    >
      Button Demo
    </ButtonBase>
  </Box>
);

export const Ellipsis: ComponentStory<typeof ButtonBase> = (args) => (
  <Box backgroundColor={BackgroundColor.primaryMuted} style={{ width: 150 }}>
    <ButtonBase {...args}>Example without ellipsis</ButtonBase>
    <ButtonBase {...args} ellipsis>
      Example with ellipsis
    </ButtonBase>
  </Box>
);
