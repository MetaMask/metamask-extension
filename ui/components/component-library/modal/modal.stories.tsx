import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { BlockSize, Display } from '../../../helpers/constants/design-system';

import { Text } from '../text';
import { Modal } from './modal';

import README from './README.mdx';
import { ButtonLink, ButtonLinkSize } from '../button-link';
import { Box } from '../box';
import { Button } from '../button';
import { IconName } from '../icon';
import { ModalOverlay } from '../modal-overlay';
import { ModalContent } from '../modal-content';
import { ModalHeader } from '../modal-header';
import { ModalBody } from '../modal-body';
import { ModalFooter } from '../modal-footer';
import { TextFieldSearch } from '../text-field-search';

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
  },
  args: {
    children: <Text>ModalBody children</Text>,
  },
} as Meta<typeof Modal>;

const LoremIpsum = (props) => (
  <Text marginBottom={8} {...props}>
    Lorem ipsum dolor sit amet, conse{' '}
    <ButtonLink size={ButtonLinkSize.Inherit}>
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

const Template: StoryFn<typeof Modal> = (args) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoremIpsum, setShowLoremIpsum] = useState(true);
  const [showMoreModalContent, setShowMoreModalContent] = useState(true);

  const handleOnClick = () => {
    setIsOpen(true);
  };
  const handleOnClose = () => {
    setIsOpen(false);
  };
  const handleHideLoremIpsum = () => {
    setShowLoremIpsum(!showLoremIpsum);
  };
  const handleMoreContent = () => {
    setShowMoreModalContent(!showMoreModalContent);
  };

  return (
    <Box width={BlockSize.Full} style={{ maxWidth: '700px' }}>
      <Box display={Display.Flex} gap={4}>
        <Button onClick={handleOnClick}>Open modal</Button>
        <ButtonLink
          endIconName={showLoremIpsum ? IconName.Arrow2Up : IconName.Arrow2Down}
          onClick={handleHideLoremIpsum}
        >
          {showLoremIpsum ? 'Hide' : 'Show'} scrollable content
        </ButtonLink>
      </Box>
      <Modal {...args} isOpen={isOpen} onClose={handleOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleOnClose}>Modal Header</ModalHeader>
          <ModalBody>
            {args.children}
            <Text>Show more content to check scrolling</Text>
            <ButtonLink
              endIconName={
                showLoremIpsum ? IconName.Arrow2Up : IconName.Arrow2Down
              }
              onClick={handleMoreContent}
              size={ButtonLinkSize.Inherit}
              marginBottom={2}
            >
              {showMoreModalContent ? 'Hide' : 'Show more'}
            </ButtonLink>
            {showMoreModalContent && (
              <>
                <LoremIpsum marginTop={8} />
                <LoremIpsum />
                <LoremIpsum />
                <LoremIpsum />
                <LoremIpsum />
                <LoremIpsum />
              </>
            )}
          </ModalBody>
          <ModalFooter onSubmit={handleOnClose} onCancel={handleOnClose} />
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

export const InitialFocusRef: StoryFn<typeof Modal> = (args) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleOnClick = () => {
    setIsOpen(true);
  };

  const handleOnClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={handleOnClick}>Open modal</Button>
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={handleOnClose}
        initialFocusRef={inputRef}
      >
        <ModalOverlay />
        <ModalContent>
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
            width={BlockSize.Full}
          />
          <ModalBody>{args.children}</ModalBody>
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

export const FinalFocusRef: StoryFn<typeof Modal> = (args) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleOnClick = () => {
    setIsOpen(true);
  };

  const handleOnClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={handleOnClick} marginRight={4}>
        Open modal
      </Button>
      <button ref={buttonRef}>Receives focus after close</button>
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={handleOnClose}
        finalFocusRef={buttonRef}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onClose={handleOnClose}
            onBack={handleOnClose}
            marginBottom={4}
          >
            Modal Header
          </ModalHeader>
          <ModalBody>
            <Text>{args.children}</Text>
          </ModalBody>
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
