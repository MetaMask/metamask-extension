import React, { useState } from 'react';
import Button from '../button';
import Box from '../box';
import Typography from '../typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import SlideUp from './slide-up.component';

export default {
  title: 'Components/UI/Slide-up',
  id: __filename,
  component: SlideUp,
  argTypes: {
    children: { control: 'object' },
    className: { control: 'text' },
  },
};

export const DefaultStory = (args) => {
  const [isShowingPopover, setIsShowingPopover] = useState(false);
  return (
    <div>
      <Button
        style={{ width: 'auto' }}
        onClick={() => setIsShowingPopover(true)}
      >
        Show Slide
      </Button>
      {isShowingPopover && (
        <SlideUp
          open={isShowingPopover}
          closeModal={() => setIsShowingPopover(false)}
        >
          {args.children}
          <Button onClick={() => setIsShowingPopover(false)}>
            Close modal
          </Button>
        </SlideUp>
      )}
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  children: (
    <Box padding={4}>
      <Typography variant={TYPOGRAPHY.H2}>Slide up title</Typography>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Semper eget duis at
        tellus at urna condimentum. Posuere urna nec tincidunt praesent semper.
        Arcu dictum varius duis at. A lacus vestibulum sed arcu. Orci porta non
        pulvinar neque laoreet suspendisse interdum. Pretium fusce id velit ut.
      </p>
    </Box>
  ),
};
