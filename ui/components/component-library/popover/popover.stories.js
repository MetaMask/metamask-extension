import React, { useState, useEffect } from 'react';
import Box from '../../ui/box/box';
import {
  Color,
  AlignItems,
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { TextField } from '..';
import README from './README.mdx';
import { Popover, PopoverPosition } from '.';

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

export const DefaultStory = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
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

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh', width: '200vw' }}
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
    >
      <Box
        ref={setButtonRef}
        // onClick={handleClick}
        // onMouseEnter={handleMouseEnter}
        // onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleClose}
        // backgroundColor={Color.primaryDefault}
        // style={{ width: 200, height: 200 }}
        as="input"
        type="text"
        placeholder="write a description here about a popover"
      ></Box>
      <Popover
        position={PopoverPosition.bottomStart}
        referenceElement={referenceElement}
        isOpen={isOpen}
        // hasArrow
        matchWidth
        onClose={handleClose}
        onBack={() => console.log('back')}
        {...args}
      >
        write a description here about a popover
      </Popover>
    </Box>
  );
};

DefaultStory.storyName = 'Default';
