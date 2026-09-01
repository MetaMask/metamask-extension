import React, { useState, useEffect } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { Popover } from './popover';
import { PopoverPosition } from './popover.types';
import { Box } from '../box';

export default {
  title: 'Components/ComponentLibrary/Popover (deprecated)',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the `Popover` component from the MetaMask Design System instead.',
      },
    },
  },
} as Meta<typeof Popover>;

const Template: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        onClick={handleClick}
        backgroundColor={BackgroundColor.primaryAlternative}
        style={{ width: 200, height: 200 }}
        color={TextColor.primaryInverse}
        as="button"
      >
        Click to toggle popover
      </Box>
      <Popover referenceElement={referenceElement} isOpen={isOpen} {...args} />
    </>
  );
};

export const DefaultStory = Template.bind({});

DefaultStory.args = {
  position: PopoverPosition.BottomStart,
  children: 'Popover demo without PopoverHeader',
  isPortal: false,
  hasArrow: true,
};

DefaultStory.storyName = 'Default';
