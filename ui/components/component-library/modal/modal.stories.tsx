import React, { useState } from 'react';
import { useArgs } from '@storybook/client-api';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  BLOCK_SIZES,
  BackgroundColor,
  TextColor,
  BorderRadius,
  DISPLAY,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Text,
  Button,
  ButtonLink,
  BUTTON_LINK_SIZES,
  TextFieldSearch,
  IconName,
} from '..';

import { Modal } from './modal';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/Modal',
  component: Modal,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    onClose: {
      action: 'onClose',
    },
    children: {
      control: 'node',
    },
    className: {
      control: 'string',
    },
    modalContentRef: {
      control: 'object',
    },
    isClosedOnOutsideClick: {
      control: 'boolean',
    },
    isClosedOnEscapeKey: {
      control: 'boolean',
    },
    initialFocusRef: {
      control: 'object',
    },
    finalFocusRef: {
      control: 'object',
    },
    restoreFocus: {
      control: 'boolean',
    },
    autoFocus: {
      control: 'boolean',
    },
    returnFocusOnClose: {
      control: 'boolean',
    },
  },
  args: {
    children: (
      <Text paddingTop={4}>ModalContent children after ModalHeader</Text>
    ),
  },
} as ComponentMeta<typeof Modal>;

const LoremIpsum = (props) => (
  <Text marginBottom={8} {...props}>
    Lorem ipsum dolor sit amet, conse{' '}
    <ButtonLink size={BUTTON_LINK_SIZES.INHERIT}>
      random focusable button
    </ButtonLink>{' '}
    ctetur adipiscing elit. Phasellus posuere nunc enim, quis efficitur dolor
    tempus viverra. Vivamus pharetra tempor pulvinar. Sed at dui in nisi
    fermentum volutpat. Proin ut tortor quis eros tincidunt molestie.
    Suspendisse dictum ex vitae metus consequat, et efficitur dolor luctus.
    Integer ultricies hendrerit turpis sed faucibus. Nam pellentesque metus a
    turpis sollicitudin vehicula. Phasellus rutrum luctus pulvinar. Phasellus
    quis accumsan urna. Praesent justo erat, bibendum ac volutpat ac, placerat
    in dui. Cras gravida mi et risus feugiat vulputate. Integer vulputate diam
    eu vehicula euismod. In laoreet quis eros sed tincidunt. Pellentesque purus
    dui, luctus id sem sit amet, varius congue dui
  </Text>
);

const Template: ComponentStory<typeof Modal> = (args) => {
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  const [{ isOpen }, updateArgs] = useArgs();
  const [showLoremIpsum, setShowLoremIpsum] = useState(false);
  const handleOnClick = () => {
    updateArgs({ isOpen: true });
  };
  const handleOnClose = () => {
    updateArgs({ isOpen: false });
  };
  const handleHideLoremIpsum = () => {
    setShowLoremIpsum(!showLoremIpsum);
  };

  return (
    <Box width={BLOCK_SIZES.FULL} style={{ maxWidth: '700px' }}>
      <Box display={DISPLAY.FLEX} gap={4}>
        <Button onClick={handleOnClick}>Open modal</Button>
        <ButtonLink
          endIconName={showLoremIpsum ? IconName.Arrow2Up : IconName.Arrow2Down}
          onClick={handleHideLoremIpsum}
        >
          {showLoremIpsum ? 'Hide' : 'Show'} scrollable content
        </ButtonLink>
      </Box>
      <Modal
        {...args}
        modalContentRef={modalContentRef}
        isOpen={isOpen}
        onClose={handleOnClose}
      >
        <ModalOverlay />
        <ModalContent modalContentRef={modalContentRef}>
          <ModalHeader onClose={handleOnClose} onBack={handleOnClose}>
            Modal Header
          </ModalHeader>
          {args.children}
        </ModalContent>
      </Modal>
      {showLoremIpsum && (
        <>
          <LoremIpsum marginTop={8} />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
        </>
      )}
    </Box>
  );
};
export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Usage = Template.bind({});

export const Children: ComponentStory<typeof Modal> = (args) => {
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  const [{ isOpen }, updateArgs] = useArgs();
  const handleOnClick = () => {
    updateArgs({ isOpen: true });
  };
  const handleOnClose = () => {
    updateArgs({ isOpen: false });
  };
  return (
    <>
      <Text marginBottom={2}>
        Custom Modal <strong>NOT</strong> using ModalOverlay, ModalContent,
        ModalHeader as children
      </Text>
      <Button onClick={handleOnClick}>Open modal</Button>
      <Modal
        {...args}
        modalContentRef={modalContentRef}
        isOpen={isOpen}
        onClose={handleOnClose}
      >
        <Box
          backgroundColor={BackgroundColor.primaryDefault}
          padding={8}
          borderRadius={BorderRadius.LG}
          ref={modalContentRef}
        >
          {args.children}
          <button onClick={handleOnClose}>Close</button>
        </Box>
      </Modal>
    </>
  );
};
Children.args = {
  children: (
    <Text color={TextColor.primaryInverse} marginBottom={4}>
      Custom Modal <strong>NOT</strong> using ModalOverlay, ModalContent,
      ModalHeader as children
    </Text>
  ),
};

export const IsClosedOnOutsideClick = Template.bind({});
IsClosedOnOutsideClick.args = {
  isClosedOnOutsideClick: false,
  children: (
    <Text paddingTop={4}>
      This Modal has set isClosedOnOutsideClick: false. Clicking outside this
      Modal <strong>WILL NOT</strong> close it
    </Text>
  ),
};

export const IsClosedOnEscapeKey = Template.bind({});
IsClosedOnEscapeKey.args = {
  isClosedOnEscapeKey: false,
  children: (
    <Text paddingTop={4}>
      This Modal has set isClosedOnEscapeKey: false. Pressing the ESC key{' '}
      <strong>WILL NOT</strong> close it
    </Text>
  ),
};

export const InitialFocusRef: ComponentStory<typeof Modal> = (args) => {
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLDivElement>(null);
  const [{ isOpen }, updateArgs] = useArgs();
  const handleOnClick = () => {
    updateArgs({ isOpen: true });
  };
  const handleOnClose = () => {
    updateArgs({ isOpen: false });
  };
  return (
    <>
      <Button onClick={handleOnClick}>Open modal</Button>
      <Modal
        {...args}
        modalContentRef={modalContentRef}
        isOpen={isOpen}
        onClose={handleOnClose}
        initialFocusRef={inputRef}
      >
        <ModalOverlay />
        <ModalContent modalContentRef={modalContentRef}>
          <ModalHeader
            onClose={handleOnClose}
            onBack={handleOnClose}
            marginBottom={4}
          >
            Modal Header
          </ModalHeader>
          <TextFieldSearch
            placeholder="Search"
            inputProps={{ ref: inputRef }}
            width={BLOCK_SIZES.FULL}
          />
          {args.children}
        </ModalContent>
      </Modal>
    </>
  );
};

InitialFocusRef.args = {
  children: (
    <Text paddingTop={4}>
      This Modal has set initialFocusRef to the TextFieldSearch component. When
      the Modal opens, the TextFieldSearch component will be focused.
    </Text>
  ),
};

export const FinalFocusRef: ComponentStory<typeof Modal> = (args) => {
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [{ isOpen }, updateArgs] = useArgs();
  const handleOnClick = () => {
    updateArgs({ isOpen: true });
  };
  const handleOnClose = () => {
    updateArgs({ isOpen: false });
  };
  return (
    <>
      <Button onClick={handleOnClick} marginRight={4}>
        Open modal
      </Button>
      <button ref={buttonRef}>Receives focus after close</button>
      <Modal
        {...args}
        modalContentRef={modalContentRef}
        isOpen={isOpen}
        onClose={handleOnClose}
        finalFocusRef={buttonRef}
      >
        <ModalOverlay />
        <ModalContent modalContentRef={modalContentRef}>
          <ModalHeader
            onClose={handleOnClose}
            onBack={handleOnClose}
            marginBottom={4}
          >
            Modal Header
          </ModalHeader>
          <Text>{args.children}</Text>
        </ModalContent>
      </Modal>
    </>
  );
};

FinalFocusRef.args = {
  children: (
    <Text paddingTop={4}>
      This Modal has set finalFocusRef to the second button element. When the
      Modal closes, the second button component will be focused. Use keyboard
      navigation to see it clearly.
    </Text>
  ),
};

export const RestoreFocus = Template.bind({});
RestoreFocus.args = {
  restoreFocus: true,
  children: (
    <Text paddingTop={4}>
      This Modal has set restoreFocus: true. When the Modal closes, the Button
      component will be focused. Use keyboard navigation to see it clearly.
    </Text>
  ),
};

export const AutoFocus = Template.bind({});
AutoFocus.args = {
  autoFocus: false,
  children: (
    <Text paddingTop={4}>
      This Modal has set autoFocus: false. When the Modal opens the first
      element to focus <strong>WILL NOT</strong> be the first focusable element
      in the Modal.
    </Text>
  ),
};
