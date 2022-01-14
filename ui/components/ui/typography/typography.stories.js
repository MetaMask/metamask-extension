import React from 'react';
import {
  COLORS,
  FONT_WEIGHT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import README from './README.mdx';
import Typography from '.';

export default {
  title: 'Components/UI/Typography',
  id: __filename,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    color: {
      control: { type: 'select' },
      options: COLORS,
      defaultValue: COLORS.BLACK,
    },
    align: {
      control: { type: 'select' },
      options: TEXT_ALIGN,
      defaultValue: TEXT_ALIGN.LEFT,
    },
    fontWeight: {
      control: { type: 'select' },
      options: FONT_WEIGHT,
      defaultValue: FONT_WEIGHT.NORMAL,
    },
    variant: {
      control: { type: 'select' },
      options: TYPOGRAPHY,
      defaultValue: TYPOGRAPHY.Paragraph,
    },
    content: {
      control: { type: 'text' },
      defaultValue: 'The quick orange fox jumped over the lazy dog.',
    },
  },
};

export const DefaultStory = (args) => (
  <div style={{ width: '80%', flexDirection: 'column' }}>
    {Object.values(TYPOGRAPHY).map((variant) => (
      <div key={variant} style={{ width: '100%' }}>
        <Typography {...args}>{variant}</Typography>
      </div>
    ))}
  </div>
);

DefaultStory.storyName = 'List';

export const TheQuickOrangeFox = (args) => (
  <div style={{ width: '80%', flexDirection: 'column' }}>
    <div style={{ width: '100%' }}>
      <Typography {...args}>{args.content}</Typography>
    </div>
  </div>
);
