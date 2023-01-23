import React from 'react';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  BORDER_STYLE,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

import README from './README.mdx';
import Card from '.';

const sizeOptions = [undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default {
  title: 'Components/UI/Card',

  component: Card,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: { control: 'text' },
    border: {
      control: 'boolean',
    },
    borderStyle: {
      control: {
        type: 'select',
      },
      options: Object.values(BORDER_STYLE),
    },
    borderWidth: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    borderColor: {
      control: {
        type: 'select',
      },
      options: Object.values(COLORS),
    },
    backgroundColor: {
      control: {
        type: 'select',
      },
      options: Object.values(COLORS),
    },
    width: {
      control: {
        type: 'select',
      },
      options: Object.values(BLOCK_SIZES),
    },
    height: {
      control: {
        type: 'select',
      },
      options: Object.values(BLOCK_SIZES),
    },
    textAlign: {
      control: {
        type: 'select',
      },
      options: Object.values(TEXT_ALIGN),
    },
    margin: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    marginTop: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    marginRight: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    marginBottom: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    marginLeft: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    padding: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    paddingTop: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    paddingRight: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    paddingBottom: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    paddingLeft: {
      control: {
        type: 'select',
      },
      options: [...sizeOptions],
    },
    display: {
      control: {
        type: 'select',
      },
      options: Object.values(DISPLAY),
    },
    justifyContent: {
      control: {
        type: 'select',
      },
      options: Object.values(JUSTIFY_CONTENT),
    },
    alignItems: {
      control: {
        type: 'select',
      },
      options: Object.values(ALIGN_ITEMS),
    },
  },
  args: {
    children: 'Card children',
  },
};

export const DefaultStory = (args) => <Card {...args}>{args.children}</Card>;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  padding: 4,
  border: true,
  borderWidth: 1,
  borderColor: COLORS.BORDER_DEFAULT,
  borderStyle: BORDER_STYLE.SOLID,
  backgroundColor: COLORS.BACKGROUND_DEFAULT,
  display: DISPLAY.BLOCK,
};
