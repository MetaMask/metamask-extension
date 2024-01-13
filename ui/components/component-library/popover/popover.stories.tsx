import React, { useState, useEffect } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Box, Icon, IconName, IconSize, PopoverHeader, Text } from '..';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Color,
  Display,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';

import README from './README.mdx';
import { Popover, PopoverPosition, PopoverRole } from '.';

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
    role: {
      options: PopoverRole,
      control: 'select',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    children: 'Popover',
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

  // Example of how to use keyboard events to close popover with escape key
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Example of how to use ref to open popover
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
DefaultStory.storyName = 'Default';

DefaultStory.args = {
  position: PopoverPosition.BottomStart,
  children: 'Popover demo without PopoverHeader',
  isPortal: false,
  hasArrow: true,
};

export const ReferenceElement: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      />
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

export const Children: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      />
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
      </Popover>
    </>
  );
};

export const Position: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [referenceAutoElement, setReferenceAutoElement] = useState();

  const setBoxRef = (ref) => {
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
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        marginBottom={4}
      >
        <Box
          ref={setBoxRef}
          backgroundColor={BackgroundColor.primaryMuted}
          style={{ width: 400, height: 200 }}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          textAlign={TextAlign.Center}
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
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Box
            ref={setRefAuto}
            backgroundColor={BackgroundColor.primaryMuted}
            style={{ width: 400, height: 200 }}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            textAlign={TextAlign.Center}
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

export const IsPortal: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      />
      <Popover
        referenceElement={referenceElement}
        position={PopoverPosition.RightEnd}
        isOpen={true}
        isPortal={true}
        hasArrow
        {...args}
      >
        <Text>Inspect to view the popover in the DOM (isPortal true)</Text>
      </Popover>
      <Popover
        referenceElement={referenceElement}
        position={PopoverPosition.RightStart}
        isOpen={true}
        isPortal={false}
        hasArrow
        {...args}
      >
        <Text>Inspect to view the popover in the DOM (isPortal false)</Text>
      </Popover>
    </>
  );
};

export const HasArrow: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      />
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

export const IsOpen: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(true);

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        onClick={handleClick}
        display={Display.Flex}
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

      <Popover
        position={PopoverPosition.RightEnd}
        referenceElement={referenceElement}
        hasArrow
        isOpen={isOpen}
        {...args}
      >
        <Text>isOpen tied to boolean</Text>
      </Popover>
    </>
  );
};

export const Flip: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh' }}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
    >
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={Display.Flex}
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

export const PreventOverflow: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh', width: '100vw' }}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
    >
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
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

export const ReferenceHidden: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh', width: '100vw' }}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
    >
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
      >
        Scroll to see popover referenceHidden
      </Box>
      <Popover
        position={PopoverPosition.BottomStart}
        referenceElement={referenceElement}
        isOpen={true}
        referenceHidden={false}
        hasArrow
        {...args}
      >
        <Text>false</Text>
      </Popover>
      <Popover
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
        hasArrow
        isOpen={true}
        {...args}
      >
        <Text>true</Text>
      </Popover>
    </Box>
  );
};

export const MatchWidth: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
      />
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

export const Role: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '100vh', width: '100vw' }}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
    >
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
      >
        Inspect to view role
      </Box>
      <Popover
        position={PopoverPosition.Left}
        role={PopoverRole.Dialog}
        referenceElement={referenceElement}
        isOpen={true}
        {...args}
      >
        <Text>{PopoverRole.Dialog}</Text>
      </Popover>
      <Popover
        position={PopoverPosition.Right}
        role={PopoverRole.Tooltip}
        referenceElement={referenceElement}
        isOpen={true}
        {...args}
      >
        <Text>{PopoverRole.Tooltip}</Text>
      </Popover>
    </Box>
  );
};

export const Offset: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();

  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <Box
      style={{ height: '200vh', width: '100vw' }}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
    >
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{ width: 200, height: 200 }}
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
      >
        Offset Demo
      </Box>
      <Popover
        position={PopoverPosition.Left}
        referenceElement={referenceElement}
        isOpen={true}
        {...args}
      >
        <Text>offset default</Text>
      </Popover>
      <Popover
        position={PopoverPosition.Right}
        referenceElement={referenceElement}
        isOpen={true}
        offset={[0, 32]}
        {...args}
      >
        <Text>offset override to [0,32]</Text>
      </Popover>
    </Box>
  );
};

export const OnPressEscKey: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(false);

  // Set Popover Ref
  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
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
        Click to open
      </Box>
      <Popover
        referenceElement={referenceElement}
        onPressEscKey={() => setIsOpen(false)}
        isOpen={isOpen}
        {...args}
      >
        Press esc key to close
      </Popover>
    </>
  );
};

export const OnClickOutside: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(false);

  // Set Popover Ref
  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = () => {
    setIsOpen(false);
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
        Click to open
      </Box>
      <Popover
        referenceElement={referenceElement}
        onClickOutside={handleClickOutside}
        isOpen={isOpen}
        {...args}
      >
        Click outside to close
      </Popover>
    </>
  );
};

OnClickOutside.storyName = 'onClickOutside';

export const WithPopoverHeader: StoryFn<typeof Popover> = (args) => {
  const [refTitleElement, setRefTitleElement] = useState();
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const setBoxRef = (ref) => {
    setRefTitleElement(ref);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        backgroundColor={BackgroundColor.primaryDefault}
        style={{ width: 200, height: 200 }}
        onClick={handleClick}
      />
      <Popover
        referenceElement={refTitleElement}
        isOpen={isOpen}
        hasArrow
        {...args}
      >
        <PopoverHeader
          onClose={handleClick}
          onBack={() => console.log('back')}
          color={Color.inherit}
          marginBottom={4}
        >
          Popover Title
        </PopoverHeader>
        Title should be short and concise. It should be sentence case and no
        period.
      </Popover>
    </>
  );
};

export const MouseEventDemo: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(false);

  // Set Popover Ref
  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  // Example of how to use mouse events to open and close popover
  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        backgroundColor={BackgroundColor.primaryAlternative}
        style={{ width: 200, height: 200 }}
        color={TextColor.primaryInverse}
      >
        Hover
      </Box>
      <Popover referenceElement={referenceElement} isOpen={isOpen} {...args}>
        onMouseEnter and onMouseLeave
      </Popover>
    </>
  );
};

export const OnFocusBlur: StoryFn<typeof Popover> = (args) => {
  const [referenceElement, setReferenceElement] = useState();
  const [isOpen, setIsOpen] = useState(false);

  // Set Popover Ref
  const setBoxRef = (ref) => {
    setReferenceElement(ref);
  };

  // Example of how open popover with focus and pair with onBlur to close popover
  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Box
        ref={setBoxRef}
        onFocus={handleFocus}
        onBlur={handleClose}
        backgroundColor={BackgroundColor.primaryAlternative}
        style={{ width: 200, height: 200 }}
        color={TextColor.primaryInverse}
        as="button"
      >
        Focus to open
      </Box>
      <Popover referenceElement={referenceElement} isOpen={isOpen} {...args}>
        onFocus to open and onBlur to close
      </Popover>
    </>
  );
};
