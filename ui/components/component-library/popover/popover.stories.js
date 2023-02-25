import React from 'react';
import Box from '../../ui/box/box';
import {
  AlignItems,
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import README from './README.mdx';
import { Popover } from '.';

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
  title: 'Components/ComponentLibrary/Popover',
  component: Popover,
  parameters: {
    docs: {
      page: README,
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    children: {
      control: 'text',
    },
    className: {
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
  args: {
    children: 'Popover',
  },
};

export const DefaultStory = (args) => (
  <Box
    style={{ height: '200vh', width: '200vw' }}
    display={DISPLAY.FLEX}
    justifyContent={JustifyContent.center}
    alignItems={AlignItems.center}
  >
    <Popover placement="bottom" {...args}>
      Example
    </Popover>

    {/* <div>
        <Popover
          isOpen={isOpen}
          position="top"
          onClick
          matchWidth
          content={
            <div>
              <h2>Popover Content</h2>
              <p>This is the content of the popover.</p>
            </div>
          }
        >
          <button>Open Popover</button>
        </Popover>
      </div> */}
  </Box>
);

DefaultStory.storyName = 'Default';
