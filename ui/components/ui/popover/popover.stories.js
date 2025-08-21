import React, { useState } from 'react';
import Button from '../button';
import Box from '../box';
import Popover from './popover.component';

export default {
  title: 'Components/UI/Popover',
  component: Popover,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    children: { control: 'object' },
    footer: { control: 'object' },
    footerClassName: { control: 'text' },
    onBack: { action: 'onBack' },
    onClose: { action: 'onClose' },
    contentClassName: { control: 'text' },
    className: { control: 'text' },
    showArrow: { control: 'boolean' },
    popoverRef: { control: 'object' },
    centerTitle: { control: 'boolean' },
    headerProps: {
      control: 'object',
      description:
        'Box component props used to add container CSS for the header',
    },
    contentProps: {
      control: 'object',
      description:
        'Box component props used to add container CSS for the content',
    },
    footerProps: {
      control: 'object',
      description:
        'Box component props used to add container CSS for the footer',
    },
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
        Show Popover
      </Button>
      {isShowingPopover && (
        <Popover
          {...args}
          onClose={() => setIsShowingPopover(false)}
          title={args.title}
          subtitle={args.subtitle}
          footer={args.footer}
        >
          {args.children}
        </Popover>
      )}
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  title: 'Approve spend limit',
  subtitle: 'This is the new limit',
  footer: <button>Example Footer</button>,
  showArrow: false,
  children: (
    <Box padding={4}>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Semper eget duis at
        tellus at urna condimentum. Posuere urna nec tincidunt praesent semper.
        Arcu dictum varius duis at. A lacus vestibulum sed arcu. Orci porta non
        pulvinar neque laoreet suspendisse interdum. Pretium fusce id velit ut.
        Ut consequat semper viverra nam libero justo laoreet sit. In ante metus
        dictum at tempor commodo ullamcorper a lacus. Posuere morbi leo urna
        molestie at elementum eu facilisis sed. Libero enim sed faucibus turpis
        in eu mi bibendum neque. Amet massa vitae tortor condimentum lacinia
        quis. Pretium viverra suspendisse potenti nullam ac. Pellentesque elit
        eget gravida cum sociis natoque penatibus. Proin libero nunc consequat
        interdum varius sit amet. Est ultricies integer quis auctor elit sed
        vulputate. Ornare arcu odio ut sem nulla pharetra. Eget nullam non nisi
        est sit. Leo vel fringilla est ullamcorper eget nulla.
      </p>
    </Box>
  ),
};
