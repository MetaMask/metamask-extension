import React, { useState, useEffect } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Box from '../../ui/box/box';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Color,
  DISPLAY,
  JustifyContent,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { Icon, IconName, IconSize, PopoverHeader, Text } from '..';
import README from './README.mdx';
import { Popover, PopoverPosition } from '.';

export default {
  title: 'Components/ComponentLibrary/Popover',
  component: Popover,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: {
      control: 'text',
    },

    position: {
      options: PopoverPosition,
      control: 'select',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    children: 'Popover',
  },
} as ComponentMeta<typeof Popover>;

const Template: ComponentStory<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // Example of how to use mouse events to open and close popover
  // const handleMouseEnter = () => {
  //   setIsOpen(true);
  // };

  // const handleMouseLeave = () => {
  //   setIsOpen(false);
  // };

  // Example of how open popover with focus
  // pair with onBlur (example using handleClose) to close popover
  // const handleFocus = () => {
  //   setIsOpen(true);
  // };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Example of how to use keyboard events to close popover with escape key
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Example of how to use ref to open popover
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
        onClick={handleClick}
        // onMouseEnter={handleMouseEnter}
        // onMouseLeave={handleMouseLeave}
        // onFocus={handleFocus}
        // onBlur={handleClose}
        backgroundColor={BackgroundColor.primaryAlternative}
        style={{ width: 200, height: 200 }}
        color={Color.primaryInverse}
        as="button"
      >
        Click to toggle popover
      </Box>
      {isOpen && (
        <Popover
          position={PopoverPosition.BottomStart}
          referenceElement={referenceElement}
          isOpen={isOpen}
          hasArrow
          // matchWidth
          {...args}
        >
          write a description here about a popover
        </Popover>
      )}
    </Box>
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const ReferenceElement = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      ></Box>
      <Popover
        position={PopoverPosition.Bottom}
        referenceElement={referenceElement}
        isOpen={true}
        hasArrow
        {...args}
      >
        <Text>Reference Element</Text>
      </Popover>
    </>
  );
};

export const Children = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      ></Box>
      <Popover
        referenceElement={referenceElement}
        isOpen={true}
        hasArrow
        {...args}
      >
        <Text>
          Demo of popover with children.{' '}
          <Icon size={IconSize.Inherit} name={IconName.Info} />
        </Text>
        <Text variant={TextVariant.bodySm}>Control the content</Text>
      </Popover>
    </>
  );
};

export const Position = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();
  const [referenceAutoElement, setReferenceAutoElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  const setRefAuto = (ref) => {
    setReferenceAutoElement(ref);
  };

  return (
    <>
      <Box
        style={{
          width: '90vw',
          minWidth: '650px',
          height: '90vh',
          minHeight: '400px',
        }}
        borderColor={BorderColor.borderDefault}
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        marginBottom={4}
      >
        <Box
          ref={setButtonRef}
          backgroundColor={BackgroundColor.primaryMuted}
          style={{ width: 400, height: 200 }}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          textAlign={TEXT_ALIGN.CENTER}
        >
          Position
        </Box>
        <Popover
          position={PopoverPosition.TopStart}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.TopStart}
        </Popover>
        <Popover
          position={PopoverPosition.Top}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.Top}
        </Popover>
        <Popover
          position={PopoverPosition.TopEnd}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.TopEnd}
        </Popover>
        <Popover
          position={PopoverPosition.RightStart}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.RightStart}
        </Popover>
        <Popover
          position={PopoverPosition.Right}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.Right}
        </Popover>
        <Popover
          position={PopoverPosition.RightEnd}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.RightEnd}
        </Popover>
        <Popover
          position={PopoverPosition.BottomStart}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.BottomStart}
        </Popover>
        <Popover
          position={PopoverPosition.Bottom}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.Bottom}
        </Popover>
        <Popover
          position={PopoverPosition.BottomEnd}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.BottomEnd}
        </Popover>
        <Popover
          position={PopoverPosition.LeftStart}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.LeftStart}
        </Popover>
        <Popover
          position={PopoverPosition.Left}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.Left}
        </Popover>
        <Popover
          position={PopoverPosition.LeftEnd}
          referenceElement={referenceElement}
          isOpen={true}
          hasArrow
          {...args}
        >
          {PopoverPosition.LeftEnd}
        </Popover>
      </Box>
      <Box
        style={{
          width: '90vw',
          minWidth: '650px',
          height: '90vh',
          minHeight: '400px',
          overflow: 'scroll',
        }}
        borderColor={BorderColor.borderDefault}
      >
        <Box
          style={{
            width: '200vw',
            height: '200vh',
          }}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Box
            ref={setRefAuto}
            backgroundColor={BackgroundColor.primaryMuted}
            style={{ width: 400, height: 200 }}
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            textAlign={TEXT_ALIGN.CENTER}
          >
            Position
          </Box>
          <Popover
            position={PopoverPosition.Auto}
            referenceElement={referenceAutoElement}
            isOpen={true}
            hasArrow
            {...args}
          >
            {PopoverPosition.Auto}
          </Popover>
        </Box>
      </Box>
    </>
  );
};

export const HasArrow = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      ></Box>
      <Popover
        position={PopoverPosition.RightStart}
        referenceElement={referenceElement}
        isOpen={true}
        hasArrow
        {...args}
      >
        <Text>Popover with arrow</Text>
      </Popover>
      <Popover
        position={PopoverPosition.RightEnd}
        referenceElement={referenceElement}
        isOpen={true}
        {...args}
      >
        <Text>Popover with no arrow</Text>
      </Popover>
    </>
  );
};

export const IsOpen = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(true);

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        onClick={handleClick}
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        Click to toggle popover
      </Box>

      <Popover
        position={PopoverPosition.RightStart}
        referenceElement={referenceElement}
        isOpen={true}
        hasArrow
        {...args}
      >
        <Text>isOpen always true</Text>
      </Popover>
      {isOpen && (
        <Popover
          position={PopoverPosition.RightEnd}
          referenceElement={referenceElement}
          hasArrow
          isOpen={isOpen}
          {...args}
        >
          <Text>isOpen tied to boolean</Text>
        </Popover>
      )}
    </>
  );
};

export const Flip = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh' }}
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
    >
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        Scroll to see popover flip
      </Box>
      <Popover
        position={PopoverPosition.TopStart}
        referenceElement={referenceElement}
        isOpen={true}
        hasArrow
        {...args}
      >
        false
      </Popover>
      <Popover
        position={PopoverPosition.TopEnd}
        referenceElement={referenceElement}
        hasArrow
        flip
        isOpen={true}
        {...args}
      >
        true
      </Popover>
    </Box>
  );
};

export const PreventOverflow = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh', width: '100vw' }}
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
    >
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        textAlign={TEXT_ALIGN.CENTER}
      >
        Scroll to see popover preventOverflow
      </Box>
      <Popover
        position={PopoverPosition.Left}
        referenceElement={referenceElement}
        isOpen={true}
        hasArrow
        {...args}
      >
        false
      </Popover>
      <Popover
        position={PopoverPosition.Right}
        referenceElement={referenceElement}
        hasArrow
        preventOverflow
        isOpen={true}
        {...args}
      >
        true
      </Popover>
    </Box>
  );
};

export const ReferenceHidden = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh', width: '100vw' }}
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
    >
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        textAlign={TEXT_ALIGN.CENTER}
      >
        Scroll to see popover referenceHidden
      </Box>
      <Popover
        position={PopoverPosition.BottomStart}
        referenceElement={referenceElement}
        isOpen={true}
        hasArrow
        {...args}
      >
        <Text>false</Text>
      </Popover>
      <Popover
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
        hasArrow
        referenceHidden
        isOpen={true}
        {...args}
      >
        <Text>true</Text>
      </Popover>
    </Box>
  );
};

export const MatchWidth = ({ args }) => {
  const [referenceElement, setReferenceElement] = useState();

  const setButtonRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      ></Box>
      <Popover
        position={PopoverPosition.Bottom}
        referenceElement={referenceElement}
        isOpen={true}
        matchWidth
        {...args}
      >
        <Text>
          Setting matchWidth to true will make the popover match the width of
          the reference element
        </Text>
      </Popover>
    </>
  );
};

export const WithPopoverHeader = ({ args }) => {
  const [refTitleElement, setRefTitleElement] = useState();

  const setButtonRef = (ref) => {
    setRefTitleElement(ref);
  };

  return (
    <>
      <Box
        ref={setButtonRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      ></Box>
      <Popover
        referenceElement={refTitleElement}
        // backgroundColor={BackgroundColor.primaryDefault}
        // color={Color.primaryInverse}
        // borderColor={BorderColor.primaryDefault}
        // arrowProps={{ borderColor: BorderColor.primaryDefault }}
        isOpen={true}
        hasArrow
        {...args}
      >
        <PopoverHeader
          onClose={() => console.log('close')}
          onBack={() => console.log('back')}
          color={Color.inherit}
        >
          Popover Title
        </PopoverHeader>
        Title should be short and concise. It should be sentence case and no
        period.
      </Popover>
    </>
  );
};
