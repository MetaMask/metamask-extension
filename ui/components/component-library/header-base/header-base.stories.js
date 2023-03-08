import React from 'react';
import Box from '../../ui/box';
import {
  ICON_NAMES,
  Button,
  ButtonIcon,
  BUTTON_ICON_SIZES,
  BUTTON_SIZES,
} from '..';
import {
  Color,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import { HeaderBase } from './header-base';
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
  title: 'Components/ComponentLibrary/HeaderBase',
  component: HeaderBase,
  parameters: {
    docs: {
      page: README,
    },
    backgrounds: { default: 'alternative' },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    title: {
      control: 'text',
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

export const DefaultStory = (args) => {
  return <HeaderBase {...args} />;
};

DefaultStory.args = {
  children: 'Title is sentence case no period',
  startAccessory: (
    <ButtonIcon
      size={BUTTON_ICON_SIZES.SM}
      iconName={ICON_NAMES.ARROW_LEFT}
      ariaLabel="back"
    />
  ),
  endAccessory: (
    <ButtonIcon
      size={BUTTON_ICON_SIZES.SM}
      iconName={ICON_NAMES.CLOSE}
      ariaLabel="close"
    />
  ),
};

DefaultStory.storyName = 'Default';

export const Demo = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={4}>
    <Box backgroundColor={Color.backgroundDefault}>
      <HeaderBase {...args}>Title is sentence case no period</HeaderBase>
    </Box>
    <Box backgroundColor={Color.backgroundDefault}>
      <HeaderBase
        startAccessory={
          <ButtonIcon
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.ARROW_LEFT}
            ariaLabel="back"
          />
        }
        {...args}
      >
        Title is sentence case no period
      </HeaderBase>
    </Box>
    <Box backgroundColor={Color.backgroundDefault}>
      <HeaderBase
        endAccessory={
          <ButtonIcon
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        {...args}
      >
        Title is sentence case no period
      </HeaderBase>
    </Box>
    <Box backgroundColor={Color.backgroundDefault}>
      <HeaderBase
        startAccessory={
          <ButtonIcon
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.ARROW_LEFT}
            ariaLabel="back"
          />
        }
        endAccessory={
          <ButtonIcon
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        {...args}
      >
        Title is sentence case no period
      </HeaderBase>
    </Box>
    <Box backgroundColor={Color.backgroundDefault}>
      <HeaderBase
        startAccessory={<Button size={BUTTON_SIZES.SM}>Unlock</Button>}
        endAccessory={
          <ButtonIcon
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        {...args}
      >
        Title is sentence case no period
      </HeaderBase>
    </Box>
  </Box>
);
