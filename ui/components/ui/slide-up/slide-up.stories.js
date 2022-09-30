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
    header: { control: 'object' },
    children: { control: 'object' },
    footer: { control: 'object' },
    className: { control: 'text' },
  },
};

export const DefaultStory = (args) => {
  const [isShowingSlideUp, setIsShowingSlideUp] = useState(false);
  return (
    <div>
      {!isShowingSlideUp && (
        <Button
          style={{ width: 'auto' }}
          onClick={() => setIsShowingSlideUp(true)}
        >
          Show Slide
        </Button>
      )}

      <SlideUp
        open={isShowingSlideUp}
        header={args.header}
        footer={
          <Button onClick={() => setIsShowingSlideUp(false)}>
            Close modal
          </Button>
        }
      >
        {args.children}
      </SlideUp>
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  header: <Typography variant={TYPOGRAPHY.H2}>Slide up title</Typography>,
  children: (
    <Box padding={4}>
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
