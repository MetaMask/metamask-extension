import React from 'react';
import Box from '../box/box';
import Typography from '../typography/typography';
import Tooltip from '.';

export default {
  title: 'Components/UI/Tooltip',

  argTypes: {
    containerClassName: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    html: {
      control: 'html',
    },
    interactive: {
      control: 'boolean',
    },
    onHidden: {
      action: 'onHidden',
    },
    position: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
    },
    size: {
      control: 'select',
      options: ['small', 'regular', 'big'],
    },
    title: {
      control: 'text',
    },
    trigger: {
      control: 'any',
    },
    wrapperClassName: {
      control: 'text',
    },
    style: {
      control: 'object',
    },
    tabIndex: {
      control: 'number',
    },
    tag: {
      control: 'text',
    },
  },
  args: {
    position: 'top',
    title: 'Title of the tooltip',
    trigger: 'mouseenter',
  },
};

export const DefaultStory = (args) => (
  <Box display="flex">
    <Typography>Hover over the info icon to see the tooltip</Typography>
    <Tooltip {...args}>
      <i
        className="fa fa-sm fa-info-circle"
        style={{ color: 'var(--color-icon-alternative)' }}
      />
    </Tooltip>
  </Box>
);

DefaultStory.storyName = 'Default';

export const HTML = (args) => (
  <Box display="flex">
    <Typography>This tooltips content is html</Typography>
    <Tooltip {...args}>
      <i
        className="fa fa-sm fa-info-circle"
        style={{ color: 'var(--color-icon-alternative)' }}
      />
    </Tooltip>
  </Box>
);

HTML.args = {
  interactive: true,
  html: (
    <Box>
      And includes a <a href="#">link</a>
    </Box>
  ),
};
