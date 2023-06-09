import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BLOCK_SIZES,
  BorderColor,
  BorderStyle,
  DISPLAY,
  JustifyContent,
  TextAlign,
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
      options: Object.values(BorderStyle),
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
      options: Object.values(BorderColor),
    },
    backgroundColor: {
      control: {
        type: 'select',
      },
      options: Object.values(BackgroundColor),
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
      options: Object.values(TextAlign),
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
      options: Object.values(JustifyContent),
    },
    alignItems: {
      control: {
        type: 'select',
      },
      options: Object.values(AlignItems),
    },
  },
  args: {
    children: 'Card children',
  },
};

export const DefaultStory = (args) => <Card {...args}>{args.children}</Card>;

DefaultStory.storyName = 'Default';
